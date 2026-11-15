import { z } from 'zod';

export const CompetitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  country: z.string(),
  countryCode: z.string(),
  logo: z.string().optional(),
  order: z.number().default(0),
});

export type Competition = z.infer<typeof CompetitionSchema>;
