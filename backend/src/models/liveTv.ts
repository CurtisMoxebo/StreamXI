import { z } from 'zod';

export const LiveTvCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type LiveTvCategory = z.infer<typeof LiveTvCategorySchema>;

export const LiveTvChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  num: z.number().optional(),
  streamIcon: z.string().optional(),
  categoryId: z.string(),
  categoryName: z.string(),
  streamUrl: z.string(),
});
export type LiveTvChannel = z.infer<typeof LiveTvChannelSchema>;

export const LiveTvCategoryGroupSchema = z.object({
  category: LiveTvCategorySchema,
  totalChannels: z.number(),
  channels: z.array(LiveTvChannelSchema),
});
export type LiveTvCategoryGroup = z.infer<typeof LiveTvCategoryGroupSchema>;

export const EpgProgramSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
  startTimestamp: z.number(),
  stopTimestamp: z.number(),
  isNowPlaying: z.boolean().optional(),
});
export type EpgProgram = z.infer<typeof EpgProgramSchema>;

export const ChannelDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  streamIcon: z.string().optional(),
  streamUrl: z.string(),
  epg: z.array(EpgProgramSchema),
});
export type ChannelDetail = z.infer<typeof ChannelDetailSchema>;
