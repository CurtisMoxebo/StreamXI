import { z } from 'zod';

export const MatchResultSchema = z.enum(['W', 'D', 'L']);
export type MatchResult = z.infer<typeof MatchResultSchema>;

export const PastGameRecordSchema = z.object({
  matchId: z.string().optional(),
  opponent: z.string(),
  score: z.string(), // e.g. "2 - 1"
  result: MatchResultSchema,
  date: z.string(),
  competition: z.string().optional(),
});
export type PastGameRecord = z.infer<typeof PastGameRecordSchema>;

// Statistics for Tab 2 when game is UPCOMING (Form & Previous 5 games)
export const TeamRecentFormSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  form: z.array(MatchResultSchema).length(5),
  past5Games: z.array(PastGameRecordSchema).length(5),
  goalsScored: z.number().int().min(0),
  goalsConceded: z.number().int().min(0),
  expectedGoals: z.number().min(0), // xG
  possession: z.number().min(0).max(100), // average %
  bigChancesCreated: z.number().int().min(0),
  cleanSheets: z.number().int().min(0),
});
export type TeamRecentForm = z.infer<typeof TeamRecentFormSchema>;

export const UpcomingMatchStatsSchema = z.object({
  type: z.literal('upcoming'),
  matchId: z.string(),
  home: TeamRecentFormSchema,
  away: TeamRecentFormSchema,
});
export type UpcomingMatchStats = z.infer<typeof UpcomingMatchStatsSchema>;

// Statistics for Tab 2 when game is LIVE or FINISHED (In-game metrics)
export const StatComparisonSchema = z.object({
  home: z.number(),
  away: z.number(),
});
export type StatComparison = z.infer<typeof StatComparisonSchema>;

export const InGameMatchStatsSchema = z.object({
  type: z.enum(['live', 'finished']),
  matchId: z.string(),
  possession: StatComparisonSchema, // percentage e.g. 58 vs 42
  bigChances: StatComparisonSchema,
  totalShots: StatComparisonSchema,
  shotsOnTarget: StatComparisonSchema,
  goalkeeperSaves: StatComparisonSchema,
  cornerKicks: StatComparisonSchema,
  fouls: StatComparisonSchema,
  passes: StatComparisonSchema,
  tackles: StatComparisonSchema,
  freeKicks: StatComparisonSchema,
  yellowCards: StatComparisonSchema,
  redCards: StatComparisonSchema,
});
export type InGameMatchStats = z.infer<typeof InGameMatchStatsSchema>;

export const MatchStatsResponseSchema = z.discriminatedUnion('type', [
  UpcomingMatchStatsSchema,
  InGameMatchStatsSchema,
]);
export type MatchStatsResponse = z.infer<typeof MatchStatsResponseSchema>;
