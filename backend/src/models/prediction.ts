import { z } from 'zod';

export const BetPredictionSchema = z.object({
  title: z.string(), // e.g. "Over 1.5 Goals" or "Both Teams To Score"
  risk: z.enum(['low', 'high']),
  confidence: z.number().min(0).max(100), // e.g. 84%
  reasoning: z.string(),
});
export type BetPrediction = z.infer<typeof BetPredictionSchema>;

export const AIPredictionSchema = z.object({
  matchId: z.string(),
  probabilities: z.object({
    homeWin: z.number().min(0).max(100),
    draw: z.number().min(0).max(100),
    awayWin: z.number().min(0).max(100),
  }),
  lowRiskBets: z.array(BetPredictionSchema).length(2),
  highRiskBets: z.array(BetPredictionSchema).length(2),
  analyticalSummary: z.string(), // exactly one deep paragraph
  generatedAt: z.string().datetime(),
  model: z.string().default('gemini-3.5-flash-lite'),
});

export type AIPrediction = z.infer<typeof AIPredictionSchema>;
