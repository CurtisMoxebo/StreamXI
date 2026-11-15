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
  logo: string;
}

const TOP_LEAGUES: LeagueMeta[] = [
  { code: 'uefa.champions', name: 'UEFA Champions League', slug: 'ucl', country: 'Europe', countryCode: 'EU', order: 1, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png' },
  { code: 'eng.1', name: 'Premier League', slug: 'epl', country: 'England', countryCode: 'GB', order: 2, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png' },
  { code: 'esp.1', name: 'La Liga', slug: 'laliga', country: 'Spain', countryCode: 'ES', order: 3, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png' },
  { code: 'ita.1', name: 'Serie A', slug: 'seriea', country: 'Italy', countryCode: 'IT', order: 4, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png' },
  { code: 'ger.1', name: 'Bundesliga', slug: 'bundesliga', country: 'Germany', countryCode: 'DE', order: 5, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png' },
  { code: 'fra.1', name: 'Ligue 1', slug: 'ligue1', country: 'France', countryCode: 'FR', order: 6, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png' },
  { code: 'uefa.nations', name: 'UEFA Nations League', slug: 'unl', country: 'Europe', countryCode: 'EU', order: 7, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2395.png' },
  { code: 'uefa.europa', name: 'UEFA Europa League', slug: 'uel', country: 'Europe', countryCode: 'EU', order: 8, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2310.png' },
  { code: 'fifa.friendly', name: 'International Friendlies', slug: 'friendlies', country: 'World', countryCode: 'WW', order: 9, logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/53.png' },
];

const KNOWN_COACHES: Record<string, string> = {
  // National Teams
  cyprus: 'Sofronis Avgousti',
  lithuania: 'Edgaras Jankauskas',
  portugal: 'Roberto Martínez',
  poland: 'Michał Probierz',
  scotland: 'Steve Clarke',
  croatia: 'Zlatko Dalić',
  denmark: 'Brian Riemer',
  spain: 'Luis de la Fuente',
  switzerland: 'Murat Yakin',
  serbia: 'Dragan Stojković',
  netherlands: 'Ronald Koeman',
  hungary: 'Marco Rossi',
  germany: 'Julian Nagelsmann',
  'bosnia and herzegovina': 'Sergej Barbarez',
  bosnia: 'Sergej Barbarez',
  sweden: 'Jon Dahl Tomasson',
  slovakia: 'Francesco Calzona',
  england: 'Thomas Tuchel',
  france: 'Didier Deschamps',
  italy: 'Luciano Spalletti',
  belgium: 'Domenico Tedesco',
  israel: 'Ran Ben Shimon',
  norway: 'Ståle Solbakken',
  austria: 'Ralf Rangnick',
  slovenia: 'Matjaž Kek',
  turkey: 'Vincenzo Montella',
  wales: 'Craig Bellamy',
  iceland: 'Åge Hareide',
  montenegro: 'Robert Prosinečki',
  'czech republic': 'Ivan Hašek',
  czechia: 'Ivan Hašek',
  ukraine: 'Serhiy Rebrov',
  albania: 'Sylvinho',
  georgia: 'Willy Sagnol',
  greece: 'Ivan Jovanović',
  'republic of ireland': 'Heimir Hallgrímsson',
  ireland: 'Heimir Hallgrímsson',
  'northern ireland': "Michael O'Neill",
  finland: 'Markku Kanerva',
  romania: 'Mircea Lucescu',
  kosovo: 'Franco Foda',
  luxembourg: 'Luc Holtz',
  bulgaria: 'Ilian Iliev',
  belarus: 'Carlos Alós',
  estonia: 'Jürgen Henn',
  azerbaijan: 'Fernando Santos',
  kazakhstan: 'Stanislav Cherchesov',
  'north macedonia': 'Blagoja Milevski',
  armenia: 'Suren Chakhalyan',
  'faroe islands': 'Håkan Ericson',
  latvia: 'Paolo Nicolato',
  moldova: 'Serghei Cleșcenco',
  malta: 'Michele Marcolini',
  andorra: 'Koldo Álvarez',
  'san marino': 'Roberto Cevoli',
  gibraltar: 'Julio César Ribas',
  liechtenstein: 'Konrad Fünfstück',
  argentina: 'Lionel Scaloni',
  brazil: 'Dorival Júnior',
  colombia: 'Néstor Lorenzo',
  uruguay: 'Marcelo Bielsa',
  usa: 'Mauricio Pochettino',
  mexico: 'Javier Aguirre',

  // Premier League
  'manchester city': 'Pep Guardiola',
  arsenal: 'Mikel Arteta',
  liverpool: 'Arne Slot',
  chelsea: 'Enzo Maresca',
  'manchester united': 'Rúben Amorim',
  'tottenham hotspur': 'Ange Postecoglou',
  tottenham: 'Ange Postecoglou',
  'aston villa': 'Unai Emery',
  'newcastle united': 'Eddie Howe',
  newcastle: 'Eddie Howe',
  brighton: 'Fabian Hürzeler',
  brentford: 'Thomas Frank',
  fulham: 'Marco Silva',
  'west ham united': 'Julen Lopetegui',
  'west ham': 'Julen Lopetegui',
  'crystal palace': 'Oliver Glasner',
  everton: 'Sean Dyche',
  'wolverhampton wanderers': "Gary O'Neil",
  wolves: "Gary O'Neil",
  'nottingham forest': 'Nuno Espírito Santo',
  'leicester city': 'Ruud van Nistelrooy',
  leicester: 'Ruud van Nistelrooy',
  'ipswich town': 'Kieran McKenna',
  ipswich: 'Kieran McKenna',
  southampton: 'Russell Martin',

  // La Liga
  'real madrid': 'Carlo Ancelotti',
  barcelona: 'Hansi Flick',
  'atletico madrid': 'Diego Simeone',
  'atlético madrid': 'Diego Simeone',
  girona: 'Míchel',
  'athletic club': 'Ernesto Valverde',
  'athletic bilbao': 'Ernesto Valverde',
  'real sociedad': 'Imanol Alguacil',
  'real betis': 'Manuel Pellegrini',
  villarreal: 'Marcelino',
  sevilla: 'García Pimienta',
  'celta vigo': 'Claudio Giráldez',

  // Bundesliga
  'bayern munich': 'Vincent Kompany',
  'bayern münchen': 'Vincent Kompany',
  'bayer leverkusen': 'Xabi Alonso',
  'borussia dortmund': 'Nuri Şahin',
  'rb leipzig': 'Marco Rose',
  'eintracht frankfurt': 'Dino Toppmöller',
  'vfb stuttgart': 'Sebastian Hoeneß',

  // Serie A
  'inter milan': 'Simone Inzaghi',
  inter: 'Simone Inzaghi',
  'ac milan': 'Paulo Fonseca',
  milan: 'Paulo Fonseca',
  juventus: 'Thiago Motta',
  napoli: 'Antonio Conte',
  atalanta: 'Gian Piero Gasperini',
  roma: 'Claudio Ranieri',
  'as roma': 'Claudio Ranieri',
  lazio: 'Marco Baroni',
  fiorentina: 'Raffaele Palladino',

  // Ligue 1
  'paris saint-germain': 'Luis Enrique',
  psg: 'Luis Enrique',
  monaco: 'Adi Hütter',
  marseille: 'Roberto De Zerbi',
  lille: 'Bruno Génésio',
  lyon: 'Pierre Sage',
  nice: 'Franck Haise',
};

export function normalizePositionCode(pos?: string, name?: string, starterIndex?: number, subIndex?: number): string {
  const p = (pos || '').toUpperCase().trim();
  const n = (name || '').toLowerCase().trim();

  if (['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CF', 'LWB', 'RWB', 'AM', 'RM', 'LM'].includes(p)) {
    return p;
  }

  if (n.includes('goal')) return 'GK';
  if (n.includes('defensive mid') || n.includes('holding mid')) return 'DM';
  if (n.includes('attacking mid')) return 'CAM';
  if (n.includes('central mid') || n.includes('centre mid')) return 'CM';
  if (n.includes('right back')) return 'RB';
  if (n.includes('left back')) return 'LB';
  if (n.includes('center back') || n.includes('centre back')) return 'CB';
  if (n.includes('right wing')) return 'RW';
  if (n.includes('left wing')) return 'LW';
  if (n.includes('striker') || n.includes('centre forward') || n.includes('center forward')) return 'ST';

  if (starterIndex !== undefined) {
    const starterRoles = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CAM', 'RW', 'ST', 'LW'];
    return starterRoles[starterIndex] || 'CM';
  }

  if (p === 'G') return 'GK';
  if (p === 'D') return 'CB';
  if (p === 'M') return 'CM';
  if (p === 'F' || p === 'A') return 'ST';

  if (subIndex !== undefined) {
    const benchRoles = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'CAM', 'RW', 'ST'];
    return benchRoles[subIndex % benchRoles.length];
  }

  return p && p !== 'SUB' ? p : 'CM';
}

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

  private teamRosterCache = new Map<string, any[]>();
  private playerPhotoCache = new Map<string, string | undefined>();
  private coachCache = new Map<string, { name: string; image?: string }>();

  async resolveCoach(teamName: string, reportedCoach?: string): Promise<{ name: string; image?: string }> {
    const cacheKey = (teamName || '').toLowerCase().trim();
    if (this.coachCache.has(cacheKey)) {
      return this.coachCache.get(cacheKey)!;
    }

    let coachName = '';
    const cleanReported = (reportedCoach || '').trim();
    if (cleanReported && !/^(head coach|visiting coach|coach|manager)$/i.test(cleanReported)) {
      coachName = cleanReported;
    } else {
      // Check known coaches dictionary
      const lower = cacheKey;
      for (const [team, manager] of Object.entries(KNOWN_COACHES)) {
        if (lower === team || lower.includes(team) || team.includes(lower)) {
          coachName = manager;
          break;
        }
      }

      // If still not found, try Wikipedia manager lookup
      if (!coachName) {
        coachName = await this.fetchWikiManager(teamName);
      }
    }

    if (!coachName) {
      coachName = teamName ? `${teamName} Head Coach` : 'Head Coach';
    }

    const coachImage = await this.resolveRealPlayerPhoto(coachName);
    const result = { name: coachName, image: coachImage };
    this.coachCache.set(cacheKey, result);
    return result;
  }

  private async fetchWikiManager(teamName: string): Promise<string> {
    if (!teamName) return '';
    const titles = [
      teamName + ' national football team',
      teamName + ' F.C.',
      teamName + ' FC',
      teamName,
    ];
    for (const title of titles) {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(title)}&rvslots=*&rvprop=content&formatversion=2&format=json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) continue;
        const data = await res.json();
        const content = data.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content || '';
        if (!content) continue;
        const match = content.match(/\|\s*(?:coach|manager|head_coach)\s*=\s*(?:\{\{[^}]+\}\}\s*)*\[\[([^\]\|]+)/i);
        if (match && match[1] && !match[1].includes(':')) {
          return match[1].trim();
        }
      } catch {
        // continue
      }
    }
    return '';
  }

  private async resolveRealPlayerPhoto(name: string): Promise<string | undefined> {
    const cleanName = (name || '').trim();
    if (!cleanName || cleanName.toLowerCase().startsWith('player ') || cleanName.toLowerCase().startsWith('sub ')) {
      return undefined;
    }

    if (this.playerPhotoCache.has(cleanName)) {
      return this.playerPhotoCache.get(cleanName);
    }

    try {
      // 1. FotMob suggest API (returns direct official player cutout headshot)
      const res = await fetch(`https://apigw.fotmob.com/searchapi/suggest?term=${encodeURIComponent(cleanName)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (res.ok) {
        const data = await res.json();
        const hit = data.squadMemberSuggest?.[0]?.options?.[0] || data.playerSuggest?.[0]?.options?.[0];
        if (hit) {
          const parts = (hit.text || '').split('|');
          const id = parts[1] || hit.payload?.id;
          if (id) {
            const url = `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
            this.playerPhotoCache.set(cleanName, url);
            return url;
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      // 2. Wikipedia Summary API
      const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`, {
        headers: { 'User-Agent': 'StreamXI/1.0 (info@streamxi.com)' },
      });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData.thumbnail?.source) {
          this.playerPhotoCache.set(cleanName, wikiData.thumbnail.source);
          return wikiData.thumbnail.source;
        }
      }
    } catch {
      // ignore
    }

    this.playerPhotoCache.set(cleanName, undefined);
    return undefined;
  }

  async getMatchLineups(matchId: string): Promise<MatchLineups | null> {
    const matchMeta = this.matchCache.get(matchId);
    const leagueCode = matchMeta?.leagueCode || 'uefa.nations';

    try {
      const summary = await this.fetchSummary(matchId, leagueCode);
      if (summary && summary.rosters && summary.rosters.length >= 2) {
        const homeRoster = summary.rosters.find((r: any) => r.homeAway === 'home') || summary.rosters[0];
        const awayRoster = summary.rosters.find((r: any) => r.homeAway === 'away') || summary.rosters[1];

        const homeTeamName = homeRoster.team?.displayName || matchMeta?.match.homeTeam.name || '';
        const awayTeamName = awayRoster.team?.displayName || matchMeta?.match.awayTeam.name || '';

        const [homeCoachInfo, awayCoachInfo] = await Promise.all([
          this.resolveCoach(homeTeamName, homeRoster.coach?.[0]?.displayName),
          this.resolveCoach(awayTeamName, awayRoster.coach?.[0]?.displayName),
        ]);

        // 1. If official starting roster is already published in summary
        if (
          Array.isArray(homeRoster.roster) && homeRoster.roster.length >= 11 &&
          Array.isArray(awayRoster.roster) && awayRoster.roster.length >= 11
        ) {
          const [homeLineup, awayLineup] = await Promise.all([
            this.parseRosterToLineup(homeRoster, true, homeCoachInfo.name, homeCoachInfo.image),
            this.parseRosterToLineup(awayRoster, false, awayCoachInfo.name, awayCoachInfo.image),
          ]);

          if (homeLineup.startingXI.length === 11 && awayLineup.startingXI.length === 11) {
            return {
              matchId,
              home: homeLineup,
              away: awayLineup,
            };
          }
        }

        // 2. If match is upcoming and starting lineups not yet finalized, fetch real club/national team squad
        const homeTeamId = homeRoster.team?.id;
        const awayTeamId = awayRoster.team?.id;

        if (homeTeamId && awayTeamId) {
          const [homeAthletes, awayAthletes] = await Promise.all([
            this.fetchTeamRoster(homeTeamId, leagueCode),
            this.fetchTeamRoster(awayTeamId, leagueCode),
          ]);

          if (homeAthletes.length >= 11 && awayAthletes.length >= 11) {
            const [homeLineup, awayLineup] = await Promise.all([
              this.buildProjectedLineupFromRoster(homeAthletes, true, homeCoachInfo.name, homeCoachInfo.image),
              this.buildProjectedLineupFromRoster(awayAthletes, false, awayCoachInfo.name, awayCoachInfo.image),
            ]);

            return {
              matchId,
              home: homeLineup,
              away: awayLineup,
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[RealFootballProvider] Failed to fetch real lineups for ${matchId}:`, err);
    }

    return getSeedLineups(matchId);
  }

  private async fetchTeamRoster(teamId: string, leagueCode: string): Promise<any[]> {
    if (this.teamRosterCache.has(teamId)) {
      return this.teamRosterCache.get(teamId)!;
    }

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/teams/${teamId}/roster`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (StreamXI/1.0)' } });
      if (!res.ok) return [];
      const data = await res.json();
      const athletes = Array.isArray(data.athletes) ? data.athletes : [];
      this.teamRosterCache.set(teamId, athletes);
      return athletes;
    } catch (err) {
      console.warn(`[RealFootballProvider] Failed to fetch team roster for ${teamId}:`, err);
      return [];
    }
  }

  private async buildProjectedLineupFromRoster(athletes: any[], isHome: boolean, coach: string = 'Head Coach', coachImage?: string): Promise<TeamLineup> {
    const gks = athletes.filter((a) => a.position?.abbreviation === 'G' || a.position?.name?.toLowerCase().includes('goal'));
    const defs = athletes.filter((a) => a.position?.abbreviation === 'D' || a.position?.name?.toLowerCase().includes('defend'));
    const mids = athletes.filter((a) => a.position?.abbreviation === 'M' || a.position?.name?.toLowerCase().includes('midfield'));
    const atts = athletes.filter((a) => a.position?.abbreviation === 'F' || a.position?.abbreviation === 'A' || a.position?.name?.toLowerCase().includes('forward') || a.position?.name?.toLowerCase().includes('attack'));

    const starters: any[] = [];
    const usedIds = new Set<string>();

    const pick = (pool: any[], count: number) => {
      let picked = 0;
      for (const a of pool) {
        if (picked >= count) break;
        if (!usedIds.has(a.id)) {
          usedIds.add(a.id);
          starters.push(a);
          picked++;
        }
      }
    };

    // 4-3-3 formation: 1 GK, 4 DF, 3 MF, 3 FW
    pick(gks, 1);
    pick(defs, 4);
    pick(mids, 3);
    pick(atts, 3);

    // If any role lacked enough players, fill from remaining athletes
    if (starters.length < 11) {
      for (const a of athletes) {
        if (starters.length >= 11) break;
        if (!usedIds.has(a.id)) {
          usedIds.add(a.id);
          starters.push(a);
        }
      }
    }

    // Coordinates mapping
    const mapCoordinates = (idx: number, isH: boolean) => {
      const gkX = isH ? 10 : 90;
      const defX = isH ? 21 : 79;
      const midX = isH ? 31 : 69;
      const attX = isH ? 41 : 59;

      if (idx === 0) return { gridX: gkX, gridY: 50 };
      if (idx <= 4) {
        const spread = [20, 40, 60, 80];
        return { gridX: defX, gridY: spread[idx - 1] || 50 };
      }
      if (idx <= 7) {
        const spread = [30, 50, 70];
        return { gridX: midX, gridY: spread[idx - 5] || 50 };
      }
      const spread = [25, 50, 75];
      return { gridX: attX, gridY: spread[idx - 8] || 50 };
    };

    const jerseyDefaults = [1, 2, 3, 4, 5, 6, 8, 10, 7, 9, 11];

    const startersToMap = starters.slice(0, 11);
    const subsPool = athletes.filter((a) => !usedIds.has(a.id)).slice(0, 9);

    const [startingPhotos, subsPhotos] = await Promise.all([
      Promise.all(startersToMap.map((a) => this.resolveRealPlayerPhoto(a.displayName || a.fullName || a.shortName || ''))),
      Promise.all(subsPool.map((a) => this.resolveRealPlayerPhoto(a.displayName || a.fullName || a.shortName || ''))),
    ]);

    const startingXI: PitchPlayer[] = startersToMap.map((a, i) => {
      const coords = mapCoordinates(i, isHome);
      const athleteName = a.displayName || a.fullName || a.shortName || `Player ${i + 1}`;
      return {
        id: String(a.id || `p-${isHome ? 'h' : 'a'}-${i}`),
        name: athleteName,
        number: parseInt(a.jersey) || jerseyDefaults[i] || i + 1,
        position: normalizePositionCode(a.position?.abbreviation, a.position?.name, i),
        image: startingPhotos[i] || a.headshot?.href,
        gridX: coords.gridX,
        gridY: coords.gridY,
      };
    });

    const substitutes: PitchPlayer[] = subsPool.map((a, i) => {
      const athleteName = a.displayName || a.fullName || a.shortName || `Sub ${i + 1}`;
      return {
        id: String(a.id || `sub-${isHome ? 'h' : 'a'}-${i}`),
        name: athleteName,
        number: parseInt(a.jersey) || 12 + i,
        position: normalizePositionCode(a.position?.abbreviation, a.position?.name, undefined, i),
        image: subsPhotos[i] || a.headshot?.href,
        gridX: 0,
        gridY: 0,
      };
    });

    return {
      formation: '4-3-3',
      confirmed: false,
      coach,
      coachImage,
      startingXI,
      substitutes,
    };
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
            logo: league.logo,
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

  private async parseRosterToLineup(rosterData: any, isHome: boolean, coachName?: string, coachImage?: string): Promise<TeamLineup> {
    const formation = rosterData?.formation || '4-3-3';
    const coach = coachName || rosterData?.coach?.[0]?.displayName || (isHome ? 'Head Coach' : 'Visiting Coach');
    const athletes = Array.isArray(rosterData?.roster) ? rosterData.roster : [];

    const startingAthletes = athletes.filter((a: any) => a.starter).slice(0, 11);
    const subAthletes = athletes.filter((a: any) => !a.starter).slice(0, 9);

    const startersToMap = startingAthletes.length === 11 ? startingAthletes : athletes.slice(0, 11);
    const subsToMap = subAthletes.length > 0 ? subAthletes : athletes.slice(11, 20);

    // Coordinate mapping helper for horizontal pitch (Home left 0-50%, Away right 50-100%)
    const mapCoordinates = (idx: number, total: number, isH: boolean): { gridX: number; gridY: number } => {
      const gkX = isH ? 10 : 90;
      const defX = isH ? 21 : 79;
      const midX = isH ? 31 : 69;
      const attX = isH ? 41 : 59;

      if (idx === 0) {
        // Goalkeeper
        return { gridX: gkX, gridY: 50 };
      }

      // Distribute remaining 10 outfield players in 3 bands (Defense, Midfield, Attack)
      if (idx <= 4) {
        const spread = [20, 40, 60, 80];
        return { gridX: defX, gridY: spread[idx - 1] || 50 };
      }
      if (idx <= 7) {
        const spread = [30, 50, 70];
        return { gridX: midX, gridY: spread[idx - 5] || 50 };
      }
      const spread = [25, 50, 75];
      return { gridX: attX, gridY: spread[idx - 8] || 50 };
    };

    const [startingPhotos, subsPhotos] = await Promise.all([
      Promise.all(startersToMap.map((p: any) => this.resolveRealPlayerPhoto(p.athlete?.displayName || p.athlete?.shortName || ''))),
      Promise.all(subsToMap.map((p: any) => this.resolveRealPlayerPhoto(p.athlete?.displayName || p.athlete?.shortName || ''))),
    ]);

    const startingXI: PitchPlayer[] = startersToMap.map((p: any, i: number) => {
      const coords = mapCoordinates(i, 11, isHome);
      const athleteId = p.athlete?.id;
      const athleteName = p.athlete?.displayName || p.athlete?.shortName || `Player ${i + 1}`;
      return {
        id: String(athleteId || `p-${isHome ? 'h' : 'a'}-${i}`),
        name: athleteName,
        number: parseInt(p.jersey) || i + 1,
        position: normalizePositionCode(p.position?.abbreviation, p.position?.name, i),
        image: startingPhotos[i] || p.athlete?.headshot?.href,
        gridX: coords.gridX,
        gridY: coords.gridY,
      };
    });

    const substitutes: PitchPlayer[] = subsToMap.map((p: any, i: number) => {
      const athleteId = p.athlete?.id;
      const athleteName = p.athlete?.displayName || p.athlete?.shortName || `Sub ${i + 1}`;
      return {
        id: String(athleteId || `sub-${isHome ? 'h' : 'a'}-${i}`),
        name: athleteName,
        number: parseInt(p.jersey) || 12 + i,
        position: normalizePositionCode(p.position?.abbreviation, p.position?.name, undefined, i),
        image: subsPhotos[i] || p.athlete?.headshot?.href,
        gridX: 0,
        gridY: 0,
      };
    });

    return {
      formation,
      confirmed: startingAthletes.length === 11,
      coach,
      coachImage,
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
