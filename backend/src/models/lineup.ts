import { z } from 'zod';

export const PitchPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number().int().min(1).max(99),
  position: z.string(), // GK, LB, CB, RB, CM, CAM, RW, LW, ST, etc.
  image: z.string().optional(),
  gridX: z.number().min(0).max(100), // X percentage on the football pitch (0-100)
  gridY: z.number().min(0).max(100), // Y percentage on the football pitch (0-100)
});
export type PitchPlayer = z.infer<typeof PitchPlayerSchema>;

export const TeamLineupSchema = z.object({
  formation: z.string(), // e.g. "4-3-3", "4-2-3-1"
  confirmed: z.boolean(), // true if official, false if potential/projected
  coach: z.string(),
  startingXI: z.array(PitchPlayerSchema).length(11),
  substitutes: z.array(PitchPlayerSchema),
});
export type TeamLineup = z.infer<typeof TeamLineupSchema>;

export const MatchLineupsSchema = z.object({
  matchId: z.string(),
  home: TeamLineupSchema,
  away: TeamLineupSchema,
});
export type MatchLineups = z.infer<typeof MatchLineupsSchema>;
