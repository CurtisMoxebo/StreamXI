export interface Competition {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  logo?: string;
  order: number;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  code: string;
  country: string;
  logo?: string;
}

export interface GoalScorer {
  id: string;
  playerName: string;
  minute: number;
  teamId: string;
  isOwnGoal?: boolean;
  isPenalty?: boolean;
}

export interface RedCard {
  id: string;
  playerName: string;
  minute: number;
  teamId: string;
}

export interface MatchScore {
  home: number;
  away: number;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Match {
  id: string;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  kickoffTime: string;
  status: MatchStatus;
  liveMinute?: number;
  score?: MatchScore;
  scorers: GoalScorer[];
  redCards: RedCard[];
  venue?: string;
}

export interface PitchPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  image?: string;
  gridX: number; // 0-100
  gridY: number; // 0-100
}

export interface TeamLineup {
  formation: string;
  confirmed: boolean;
  coach: string;
  startingXI: PitchPlayer[];
  substitutes: PitchPlayer[];
}

export interface MatchLineups {
  matchId: string;
  home: TeamLineup;
  away: TeamLineup;
}

export interface PastGameRecord {
  opponent: string;
  score: string;
  result: 'W' | 'D' | 'L';
  date: string;
  competition?: string;
}

export interface TeamRecentForm {
  teamId: string;
  teamName: string;
  form: ('W' | 'D' | 'L')[];
  past5Games: PastGameRecord[];
  goalsScored: number;
  goalsConceded: number;
  expectedGoals: number;
  possession: number;
  bigChancesCreated: number;
  cleanSheets: number;
}

export interface UpcomingMatchStats {
  type: 'upcoming';
  matchId: string;
  home: TeamRecentForm;
  away: TeamRecentForm;
}

export interface InGameMatchStats {
  type: 'live' | 'finished';
  matchId: string;
  possession: { home: number; away: number };
  bigChances: { home: number; away: number };
  totalShots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  goalkeeperSaves: { home: number; away: number };
  cornerKicks: { home: number; away: number };
  fouls: { home: number; away: number };
  passes: { home: number; away: number };
  tackles: { home: number; away: number };
  freeKicks: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

export type MatchStatsResponse = UpcomingMatchStats | InGameMatchStats;

export interface BetPrediction {
  title: string;
  risk: 'low' | 'high';
  confidence: number;
  reasoning: string;
}

export interface AIPrediction {
  matchId: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  lowRiskBets: [BetPrediction, BetPrediction];
  highRiskBets: [BetPrediction, BetPrediction];
  analyticalSummary: string;
  generatedAt: string;
  model: string;
}

export interface StreamChannel {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  streamUrl: string;
}

export interface MatchStreamInfo {
  matchId: string;
  status: 'ended' | 'upcoming' | 'ready';
  statusMessage: string;
  minutesToKickoff: number;
  channels: StreamChannel[];
  activeChannelId?: string;
}
