import { z } from 'zod';

export const StreamChannelSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Canal+ Foot", "TNT Sports 1", "Movistar Liga de Campeones"
  country: z.string(), // "France", "England", "Spain", etc.
  countryCode: z.string(), // "fr", "en", "es"
  flag: z.string(), // "🇫🇷", "🇬🇧", "🇪🇸"
  streamUrl: z.string(), // stream endpoint / proxy link
});
export type StreamChannel = z.infer<typeof StreamChannelSchema>;

export const StreamAvailabilitySchema = z.enum(['ended', 'upcoming', 'ready']);
export type StreamAvailability = z.infer<typeof StreamAvailabilitySchema>;

export const MatchStreamInfoSchema = z.object({
  matchId: z.string(),
  status: StreamAvailabilitySchema,
  statusMessage: z.string(),
  minutesToKickoff: z.number().int(),
  channels: z.array(StreamChannelSchema),
  activeChannelId: z.string().optional(),
});
export type MatchStreamInfo = z.infer<typeof MatchStreamInfoSchema>;
