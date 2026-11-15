import { Router, Request, Response } from 'express';
import { liveTvService } from '../services/streaming/LiveTvService.js';
import { logger, getClientIp } from '../utils/logger.js';

export const liveTvRouter = Router();

/**
 * GET /api/livetv/categories
 * Returns all available Live TV categories.
 */
liveTvRouter.get('/categories', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const categories = await liveTvService.getCategories();
    res.json(categories);
  } catch (err: any) {
    logger.error(`[LiveTvRoute] Error retrieving categories (Client [IP: ${clientIp}]):`, err);
    res.status(500).json({ error: 'Failed to retrieve TV categories' });
  }
});

/**
 * GET /api/livetv/channels
 * Returns TV channels grouped by category.
 * Supports:
 * - ?search=query (filters channels by channel name OR category name)
 * - ?categoryId=id (filters to specific category)
 * - ?limit=number (limit per category)
 */
liveTvRouter.get('/channels', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;

  try {
    const groups = await liveTvService.getCategoryGroups({
      search,
      categoryId,
      limitPerCategory: limit,
    });
    res.json({
      totalGroups: groups.length,
      groups,
    });
  } catch (err: any) {
    logger.error(`[LiveTvRoute] Error retrieving channels (Client [IP: ${clientIp}]):`, err);
    res.status(500).json({ error: 'Failed to retrieve TV channels' });
  }
});

/**
 * GET /api/livetv/channels/:channelId
 * Returns single channel detail, metadata, and EPG program listings.
 */
liveTvRouter.get('/channels/:channelId', async (req: Request<{ channelId: string }>, res: Response) => {
  const channelId = String(req.params.channelId);
  const clientIp = getClientIp(req);

  try {
    const channel = await liveTvService.getChannelDetail(channelId);
    if (!channel) {
      res.status(404).json({ error: `TV channel '${channelId}' not found` });
      return;
    }
    res.json(channel);
  } catch (err: any) {
    logger.error(`[LiveTvRoute] Error retrieving channel ${channelId} (Client [IP: ${clientIp}]):`, err);
    res.status(500).json({ error: 'Failed to retrieve TV channel details' });
  }
});

/**
 * GET /api/livetv/channels/:channelId/epg
 * Returns EPG program listings for a specific channel.
 */
liveTvRouter.get('/channels/:channelId/epg', async (req: Request<{ channelId: string }>, res: Response) => {
  const channelId = String(req.params.channelId);
  const clientIp = getClientIp(req);

  try {
    const epg = await liveTvService.getChannelEpg(channelId);
    res.json(epg);
  } catch (err: any) {
    logger.error(`[LiveTvRoute] Error retrieving EPG for ${channelId} (Client [IP: ${clientIp}]):`, err);
    res.status(500).json({ error: 'Failed to retrieve EPG listings' });
  }
});
