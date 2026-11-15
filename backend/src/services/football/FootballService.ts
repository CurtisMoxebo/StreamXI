import { IFootballDataProvider } from './IFootballDataProvider.js';
import { RealFootballProvider } from './RealFootballProvider.js';
import { Competition, Match, MatchLineups, MatchStatsResponse } from '../../models/index.js';

export interface GroupedCompetitionMatches {
  competition: Competition;
  matches: Match[];
}

export class FootballService {
  private provider: IFootballDataProvider;

  constructor(provider?: IFootballDataProvider) {
    this.provider = provider || new RealFootballProvider();
  }

  // Switch or inject a different provider (e.g. external football API in the future)
  setProvider(provider: IFootballDataProvider) {
    this.provider = provider;
  }

  /**
   * Retrieves matches for a specific date (00:00 to 23:59),
   * sorted chronologically by kickoff time, and grouped by competition.
   */
  async getMatchesGroupedByCompetition(dateString?: string): Promise<{
    date: string;
    totalMatches: number;
    groups: GroupedCompetitionMatches[];
  }> {
    const targetDate = dateString ? dateString.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const rawMatches = await this.provider.getMatchesByDate(targetDate);

    // Filter to ensure games match the target date (00:00 to 23:59)
    const filteredMatches = rawMatches.filter((m) => {
      const matchDate = m.kickoffTime.substring(0, 10);
      return matchDate === targetDate;
    });

    // Sort matches chronologically by kickoff time
    filteredMatches.sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());

    // Group by competition
    const groupsMap = new Map<string, { competition: Competition; matches: Match[] }>();

    for (const match of filteredMatches) {
      const compId = match.competition.id;
      if (!groupsMap.has(compId)) {
        groupsMap.set(compId, {
          competition: match.competition,
          matches: [],
        });
      }
      groupsMap.get(compId)!.matches.push(match);
    }

    // Convert map to array and sort groups by competition order
    const groups = Array.from(groupsMap.values()).sort((a, b) => a.competition.order - b.competition.order);

    return {
      date: targetDate,
      totalMatches: filteredMatches.length,
      groups,
    };
  }

  async getMatchById(id: string): Promise<Match | null> {
    return this.provider.getMatchById(id);
  }

  async getMatchLineups(matchId: string): Promise<MatchLineups | null> {
    return this.provider.getMatchLineups(matchId);
  }

  async getMatchStats(matchId: string): Promise<MatchStatsResponse | null> {
    return this.provider.getMatchStats(matchId);
  }
}

export const footballService = new FootballService();
