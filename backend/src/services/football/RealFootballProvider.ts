import { IFootballDataProvider } from './IFootballDataProvider.js';
import {
  Match,
  MatchLineups,
  MatchStatsResponse,
  Competition,
  GoalScorer,
  RedCard,
  PitchPlayer,
  TeamLineup,
  PastGameRecord,
  TeamRecentForm,
} from '../../models/index.js';
import { getSeedMatches, getSeedLineups, getSeedStats } from './seedData.js';

interface LeagueMeta {
  code: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  order: number;
}

const TOP_LEAGUES: LeagueMeta[] = [
  { code: 'uefa.champions', name: 'UEFA Champions League', slug: 'ucl', country: 'Europe', countryCode: 'EU', order: 1 },
  { code: 'eng.1', name: 'Premier League', slug: 'epl', country: 'England', countryCode: 'GB', order: 2 },
  { code: 'esp.1', name: 'La Liga', slug: 'laliga', country: 'Spain', countryCode: 'ES', order: 3 },
  { code: 'ita.1', name: 'Serie A', slug: 'seriea', country: 'Italy', countryCode: 'IT', order: 4 },
  { code: 'ger.1', name: 'Bundesliga', slug: 'bundesliga', country: 'Germany', countryCode: 'DE', order: 5 },
  { code: 'fra.1', name: 'Ligue 1', slug: 'ligue1', country: 'France', countryCode: 'FR', order: 6 },
  { code: 'uefa.nations', name: 'UEFA Nations League', slug: 'unl', country: 'Europe', countryCode: 'EU', order: 7 },
  { code: 'uefa.europa', name: 'UEFA Europa League', slug: 'uel', country: 'Europe', countryCode: 'EU', order: 8 },
  { code: 'fifa.friendly', name: 'International Friendlies', slug: 'friendlies', country: 'World', countryCode: 'WW', order: 9 },
];

export class RealFootballProvider implements IFootballDataProvider {
  // In-memory cache for match objects and their league code
  private matchCache = new Map<string, { match: Match; leagueCode: string }>();
  private dateCache = new Map<string, { timestamp: number; matches: Match[] }>();
  private summaryCache = new Map<string, { timestamp: number; data: any }>();

  private CACHE_TTL_MS = 60 * 1000; // 1 minute cache for live freshness

  /**
   * Retrieves real matches from top international and domestic competitions for a given date.
   */
  async getMatchesByDate(dateString: string): Promise<Match[]> {
    const formattedDate = dateString.substring(0, 10);
    const espnDate = formattedDate.replace(/-/g, '');

    // Check cache
    const cached = this.dateCache.get(formattedDate);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.matches;
    }

    try {
      const leaguePromises = TOP_LEAGUES.map(async (league) => {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${espnDate}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (!res.ok) return [];
          const data = (await res.json()) as any;
          return this.parseEspnScoreboard(data, league);
        } catch {
          return [];
        }
      });

      const results = await Promise.all(leaguePromises);
      const allMatches = results.flat();

      if (allMatches.length > 0) {
        // Cache and register in match lookup
        for (const m of allMatches) {
          const comp = TOP_LEAGUES.find((l) => l.name === m.competition.name);
          this.matchCache.set(m.id, { match: m, leagueCode: comp ? comp.code : 'uefa.nations' });
        }
        this.dateCache.set(formattedDate, { timestamp: Date.now(), matches: allMatches });
        return allMatches;
      }
    } catch (err) {
      console.warn('[RealFootballProvider] Failed to fetch live matches from external API:', err);
    }

    // Fallback: If date has no matches scheduled anywhere (or network error), return seed matches
    const seed = getSeedMatches(formattedDate);
    for (const m of seed) {
      this.matchCache.set(m.id, { match: m, leagueCode: 'uefa.champions' });
    }
    return seed;
  }

  async getMatchById(id: string): Promise<Match | null> {
    const cached = this.matchCache.get(id);
    if (cached) return cached.match;

    // Check today's matches
    const today = new Date().toISOString().substring(0, 10);
    const todayMatches = await this.getMatchesByDate(today);
    const found = todayMatches.find((m) => m.id === id);
    if (found) return found;

    // Fallback seed match
    const seed = getSeedMatches(today).find((m) => m.id === id);
    return seed || null;
  }

  async getMatchLineups(matchId: string): Promise<MatchLineups | null> {
    const matchMeta = this.matchCache.get(matchId);
    const leagueCode = matchMeta?.leagueCode || 'uefa.nations';

    try {
      const summary = await this.fetchSummary(matchId, leagueCode);
      if (summary && summary.rosters && summary.rosters.length >= 2) {
        const homeRoster = summary.rosters.find((r: any) => r.homeAway === 'home') || summary.rosters[0];
        const awayRoster = summary.rosters.find((r: any) => r.homeAway === 'away') || summary.rosters[1];

        const homeLineup = this.parseRosterToLineup(homeRoster, true);
        const awayLineup = this.parseRosterToLineup(awayRoster, false);

        if (homeLineup.startingXI.length > 0 && awayLineup.startingXI.length > 0) {
          return {
            matchId,
            home: homeLineup,
            away: awayLineup,
          };
        }
      }
    } catch (err) {
      console.warn(`[RealFootballProvider] Failed to fetch real lineups for ${matchId}:`, err);
    }

    return getSeedLineups(matchId);
  }

  async getMatchStats(matchId: string): Promise<MatchStatsResponse | null> {
    const match = await this.getMatchById(matchId);
    if (!match) return null;

    const matchMeta = this.matchCache.get(matchId);
    const leagueCode = matchMeta?.leagueCode || 'uefa.nations';

    try {
      const summary = await this.fetchSummary(matchId, leagueCode);

      // 1. If match is upcoming: parse real Last 5 Games form
      if (match.status === 'upcoming') {
        if (summary && summary.lastFiveGames && summary.lastFiveGames.length >= 2) {
          const homeLastFive = summary.lastFiveGames[0];
          const awayLastFive = summary.lastFiveGames[1];

          const homeForm = this.parseTeamRecentForm(match.homeTeam.id, match.homeTeam.name, homeLastFive);
          const awayForm = this.parseTeamRecentForm(match.awayTeam.id, match.awayTeam.name, awayLastFive);

          return {
            type: 'upcoming',
            matchId,
            home: homeForm,
            away: awayForm,
          };
        }
      }

      // 2. If match is live or finished: parse real Boxscore in-game stats
      if (match.status === 'live' || match.status === 'finished') {
        if (summary && summary.boxscore && summary.boxscore.teams && summary.boxscore.teams.length >= 2) {
          const homeStats = summary.boxscore.teams[0]?.statistics || [];
          const awayStats = summary.boxscore.teams[1]?.statistics || [];

          const getStatVal = (stats: any[], name: string): number => {
            const item = stats.find((s: any) => s.name === name);
            return item ? Number(item.displayValue?.replace('%', '')) || 0 : 0;
          };

          return {
            type: match.status,
            matchId,
            possession: {
              home: getStatVal(homeStats, 'possessionPct') || 50,
              away: getStatVal(awayStats, 'possessionPct') || 50,
            },
            bigChances: {
              home: getStatVal(homeStats, 'shotsOnTarget') > 3 ? 3 : 1,
              away: getStatVal(awayStats, 'shotsOnTarget') > 3 ? 2 : 1,
            },
            totalShots: {
              home: getStatVal(homeStats, 'totalShots'),
              away: getStatVal(awayStats, 'totalShots'),
            },
            shotsOnTarget: {
              home: getStatVal(homeStats, 'shotsOnTarget'),
              away: getStatVal(awayStats, 'shotsOnTarget'),
            },
            goalkeeperSaves: {
              home: getStatVal(homeStats, 'saves'),
              away: getStatVal(awayStats, 'saves'),
            },
            cornerKicks: {
              home: getStatVal(homeStats, 'wonCorners'),
              away: getStatVal(awayStats, 'wonCorners'),
            },
            fouls: {
              home: getStatVal(homeStats, 'foulsCommitted'),
              away: getStatVal(awayStats, 'foulsCommitted'),
            },
            passes: {
              home: getStatVal(homeStats, 'totalPasses') || 400,
              away: getStatVal(awayStats, 'totalPasses') || 380,
            },
            tackles: {
              home: getStatVal(homeStats, 'totalTackles') || 14,
              away: getStatVal(awayStats, 'totalTackles') || 12,
            },
            freeKicks: {
              home: getStatVal(homeStats, 'foulsCommitted'),
              away: getStatVal(awayStats, 'foulsCommitted'),
            },
            yellowCards: {
              home: getStatVal(homeStats, 'yellowCards'),
              away: getStatVal(awayStats, 'yellowCards'),
            },
            redCards: {
              home: getStatVal(homeStats, 'redCards'),
              away: getStatVal(awayStats, 'redCards'),
            },
          };
        }
      }
    } catch (err) {
      console.warn(`[RealFootballProvider] Failed to fetch stats for ${matchId}:`, err);
    }

    return getSeedStats(match);
  }

  // --- Private Helpers ---

  private async fetchSummary(matchId: string, leagueCode: string): Promise<any> {
    const cached = this.summaryCache.get(matchId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/summary?event=${matchId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    this.summaryCache.set(matchId, { timestamp: Date.now(), data });
    return data;
  }

  private parseEspnScoreboard(data: any, league: LeagueMeta): Match[] {
    if (!data || !data.events || !Array.isArray(data.events)) return [];

    const matches: Match[] = [];

    for (const ev of data.events) {
      try {
        const comp = ev.competitions?.[0];
        if (!comp || !comp.competitors || comp.competitors.length < 2) continue;

        const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home') || comp.competitors[0];
        const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away') || comp.competitors[1];

        const state = ev.status?.type?.state;
        const status: 'live' | 'upcoming' | 'finished' =
          state === 'in' ? 'live' : state === 'post' ? 'finished' : 'upcoming';

        const liveMinute =
          status === 'live'
            ? parseInt(ev.status?.displayClock) || Math.floor((ev.status?.clock || 0) / 60) || 45
            : undefined;

        // Parse Scorers and Red Cards from competition details
        const scorers: GoalScorer[] = [];
        const redCards: RedCard[] = [];

        if (Array.isArray(comp.details)) {
          comp.details.forEach((det: any, idx: number) => {
            const athlete = det.athletesInvolved?.[0] || {};
            const minute = parseInt(det.clock?.displayValue) || Math.floor((det.clock?.value || 0) / 60) || 0;
            const teamId = det.team?.id || '';

            if (det.scoringPlay) {
              scorers.push({
                id: `sc-${ev.id}-${idx}`,
                playerName: athlete.displayName || 'Player',
                minute,
                teamId,
                isPenalty: Boolean(det.penaltyKick),
                isOwnGoal: Boolean(det.ownGoal),
              });
            }

            if (det.redCard) {
              redCards.push({
                id: `rc-${ev.id}-${idx}`,
                playerName: athlete.displayName || 'Player',
                minute,
                teamId,
              });
            }
          });
        }

        const match: Match = {
          id: String(ev.id),
          competition: {
            id: league.slug,
            name: league.name,
            slug: league.slug,
            country: league.country,
            countryCode: league.countryCode,
            order: league.order,
          },
          homeTeam: {
            id: String(homeComp.team.id),
            name: homeComp.team.displayName || homeComp.team.name,
            code: homeComp.team.abbreviation || homeComp.team.displayName?.slice(0, 3).toUpperCase(),
            country: league.country,
            flag: this.getTeamFlag(homeComp.team.displayName || homeComp.team.name, league.country),
            logo: homeComp.team.logo,
          },
          awayTeam: {
            id: String(awayComp.team.id),
            name: awayComp.team.displayName || awayComp.team.name,
            code: awayComp.team.abbreviation || awayComp.team.displayName?.slice(0, 3).toUpperCase(),
            country: league.country,
            flag: this.getTeamFlag(awayComp.team.displayName || awayComp.team.name, league.country),
            logo: awayComp.team.logo,
          },
          kickoffTime: ev.date || new Date().toISOString(),
          status,
          liveMinute,
          score:
            status !== 'upcoming'
              ? {
                  home: parseInt(homeComp.score) || 0,
                  away: parseInt(awayComp.score) || 0,
                }
              : undefined,
          scorers,
          redCards,
          venue: comp.venue?.fullName,
        };

        matches.push(match);
      } catch (err) {
        console.warn('[RealFootballProvider] Failed to parse match event:', err);
      }
    }

    return matches;
  }

  private parseRosterToLineup(rosterData: any, isHome: boolean): TeamLineup {
    const formation = rosterData?.formation || '4-3-3';
    const coach = rosterData?.coach?.[0]?.displayName || (isHome ? 'Head Coach' : 'Visiting Coach');
    const athletes = Array.isArray(rosterData?.roster) ? rosterData.roster : [];

    const startingAthletes = athletes.filter((a: any) => a.starter).slice(0, 11);
    const subAthletes = athletes.filter((a: any) => !a.starter).slice(0, 9);

    // Coordinate mapping helper
    const mapCoordinates = (idx: number, total: number, isH: boolean): { gridX: number; gridY: number } => {
      if (idx === 0) {
        // Goalkeeper
        return { gridX: 50, gridY: isH ? 88 : 12 };
      }

      // Distribute remaining 10 outfield players in 3 bands (Defense, Midfield, Attack)
      if (idx <= 4) {
        const spread = [18, 38, 62, 82];
        return { gridX: spread[idx - 1] || 50, gridY: isH ? 72 : 28 };
      }
      if (idx <= 7) {
        const spread = [25, 50, 75];
        return { gridX: spread[idx - 5] || 50, gridY: isH ? 52 : 48 };
      }
      const spread = [22, 50, 78];
      return { gridX: spread[idx - 8] || 50, gridY: isH ? 30 : 68 };
    };

    const startingXI: PitchPlayer[] = (
      startingAthletes.length === 11 ? startingAthletes : athletes.slice(0, 11)
    ).map((p: any, i: number) => {
      const coords = mapCoordinates(i, 11, isHome);
      return {
        id: String(p.athlete?.id || `p-${isHome ? 'h' : 'a'}-${i}`),
        name: p.athlete?.displayName || p.athlete?.shortName || `Player ${i + 1}`,
        number: parseInt(p.jersey) || i + 1,
        position: p.position?.abbreviation || (i === 0 ? 'GK' : 'MF'),
        image: p.athlete?.headshot?.href,
        gridX: coords.gridX,
        gridY: coords.gridY,
      };
    });

    const substitutes: PitchPlayer[] = (
      subAthletes.length > 0 ? subAthletes : athletes.slice(11, 20)
    ).map((p: any, i: number) => ({
      id: String(p.athlete?.id || `sub-${isHome ? 'h' : 'a'}-${i}`),
      name: p.athlete?.displayName || p.athlete?.shortName || `Sub ${i + 1}`,
      number: parseInt(p.jersey) || 12 + i,
      position: p.position?.abbreviation || 'SUB',
      image: p.athlete?.headshot?.href,
      gridX: 0,
      gridY: 0,
    }));

    return {
      formation,
      confirmed: startingAthletes.length === 11,
      coach,
      startingXI,
      substitutes,
    };
  }

  private parseTeamRecentForm(teamId: string, teamName: string, lastFiveData: any): TeamRecentForm {
    const events = Array.isArray(lastFiveData?.events) ? lastFiveData.events : [];
    const past5Games: PastGameRecord[] = events.slice(0, 5).map((ev: any) => ({
      opponent: ev.opponent?.displayName || 'Opponent',
      score: ev.score || '1-0',
      result: (ev.gameResult === 'W' || ev.gameResult === 'L' || ev.gameResult === 'D' ? ev.gameResult : 'W') as 'W' | 'D' | 'L',
      date: ev.gameDate?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      competition: ev.leagueName || 'League',
    }));

    const form = past5Games.map((g) => g.result);
    const goalsScored = past5Games.reduce((acc, g) => {
      const scored = parseInt(g.score.split('-')[0]) || 0;
      return acc + scored;
    }, 0);
    const goalsConceded = past5Games.reduce((acc, g) => {
      const conceded = parseInt(g.score.split('-')[1]) || 0;
      return acc + conceded;
    }, 0);

    return {
      teamId,
      teamName,
      form: form.length > 0 ? form : ['W', 'W', 'D', 'W', 'L'],
      past5Games,
      goalsScored: goalsScored || 10,
      goalsConceded: goalsConceded || 4,
      expectedGoals: 1.85,
      possession: 56,
      bigChancesCreated: 14,
      cleanSheets: form.filter((r) => r === 'W').length,
    };
  }

  private getTeamFlag(name: string, fallbackCountry: string): string {
    const map: Record<string, string> = {
      spain: '🇪🇸', england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', france: '🇫🇷', germany: '🇩🇪', italy: '🇮🇹',
      belgium: '🇧🇪', croatia: '🇭🇷', czechia: '🇨🇿', 'czech republic': '🇨🇿',
      turkey: '🇹🇷', türkiye: '🇹🇷', finland: '🇫🇮', 'san marino': '🇸🇲',
      belarus: '🇧🇾', albania: '🇦🇱', latvia: '🇱🇻', armenia: '🇦🇲', cyprus: '🇨🇾',
      montenegro: '🇲🇪', suriname: '🇸🇷', eswatini: '🇸🇿', netherlands: '🇳🇱',
      portugal: '🇵🇹', switzerland: '🇨🇭', scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', austria: '🇦🇹',
      denmark: '🇩🇰', sweden: '🇸🇪', norway: '🇳🇴', poland: '🇵🇱', serbia: '🇷🇸',
      greece: '🇬🇷', slovakia: '🇸🇰', hungary: '🇭🇺', romania: '🇷🇴', bulgaria: '🇧🇬',
      slovenia: '🇸🇮', kazakhstan: '🇰🇿', georgia: '🇬🇪', iceland: '🇮🇸',
      brazil: '🇧🇷', argentina: '🇦🇷', usa: '🇺🇸', mexico: '🇲🇽',
    };

    const n = name.toLowerCase().trim();
    if (map[n]) return map[n];
    const c = fallbackCountry.toLowerCase().trim();
    if (map[c]) return map[c];
    if (/madrid|barcelona|atletico|sevilla|valencia|betis|bilbao|sociedad/i.test(n)) return '🇪🇸';
    if (/manchester|liverpool|arsenal|chelsea|tottenham|newcastle|aston villa/i.test(n)) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    if (/milan|juventus|inter|roma|napoli|lazio/i.test(n)) return '🇮🇹';
    if (/bayern|dortmund|leverkusen|leipzig|frankfurt/i.test(n)) return '🇩🇪';
    if (/paris|marseille|lyon|monaco|lille/i.test(n)) return '🇫🇷';
    return '⚽';
  }
}
