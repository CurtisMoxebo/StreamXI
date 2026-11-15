import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  code: z.string(),
  country: z.string(),
  countryCode: z.string().optional(),
  logo: z.string().optional(),
});

export type Team = z.infer<typeof TeamSchema>;
