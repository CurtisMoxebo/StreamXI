import { Match, MatchLineups, MatchStatsResponse } from '../../models/index.js';

export interface IFootballDataProvider {
  getMatchesByDate(dateString: string): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  getMatchLineups(matchId: string): Promise<MatchLineups | null>;
  getMatchStats(matchId: string): Promise<MatchStatsResponse | null>;
}
