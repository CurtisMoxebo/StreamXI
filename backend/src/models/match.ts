import { z } from 'zod';
import { CompetitionSchema } from './competition.js';
import { TeamSchema } from './team.js';

export const MatchStatusSchema = z.enum(['upcoming', 'live', 'finished']);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const MatchScoreSchema = z.object({
  home: z.number().int().min(0),
  away: z.number().int().min(0),
});
export type MatchScore = z.infer<typeof MatchScoreSchema>;

export const GoalScorerSchema = z.object({
  id: z.string(),
  playerName: z.string(),
  minute: z.number().int().min(1),
  teamId: z.string(),
  isOwnGoal: z.boolean().optional(),
  isPenalty: z.boolean().optional(),
});
export type GoalScorer = z.infer<typeof GoalScorerSchema>;

export const RedCardSchema = z.object({
  id: z.string(),
  playerName: z.string(),
  minute: z.number().int().min(1),
  teamId: z.string(),
});
export type RedCard = z.infer<typeof RedCardSchema>;

export const MatchSchema = z.object({
  id: z.string(),
  competition: CompetitionSchema,
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  kickoffTime: z.string().datetime(), // ISO 8601 string
  status: MatchStatusSchema,
  liveMinute: z.number().int().optional(),
  score: MatchScoreSchema.optional(),
  scorers: z.array(GoalScorerSchema).default([]),
  redCards: z.array(RedCardSchema).default([]),
  venue: z.string().optional(),
});

export type Match = z.infer<typeof MatchSchema>;
