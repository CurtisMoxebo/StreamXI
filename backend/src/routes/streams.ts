import { Router, Request, Response } from 'express';
import { xtreamService } from '../services/streaming/XtreamService.js';
import { streamRelayManager } from '../services/streaming/StreamRelayManager.js';
import { logger, getClientIp } from '../utils/logger.js';

export const streamsRouter = Router();

/**
 * GET /api/streams/matches/:id
 * Returns stream availability status & TV channel list (France, England, Spain, host country)
 */
streamsRouter.get('/matches/:id', async (req: Request<{ id: string }>, res: Response) => {
  const matchId = String(req.params.id);
  const clientIp = getClientIp(req);
  try {
    const streamInfo = await xtreamService.getMatchStreamInfo(matchId);
    res.json(streamInfo);
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      logger.warn(`[StreamRoute] Broadcast lookup failed - match not found: ${matchId} (Client [IP: ${clientIp}])`);
      res.status(404).json({ error: err.message });
      return;
    }
    logger.error(`[StreamRoute] Error creating broadcast metadata for match ${matchId} (Client [IP: ${clientIp}]):`, err);
    res.status(500).json({ error: 'Failed to retrieve stream info' });
  }
});

/**
 * GET /api/streams/status/:channelId
 * Check if a broadcast is already created and active for a specific TV channel
 */
streamsRouter.get('/status/:channelId', (req: Request<{ channelId: string }>, res: Response) => {
  const channelId = String(req.params.channelId);
  const clientIp = getClientIp(req);
  const isActive = streamRelayManager.isBroadcastActive(channelId);
  const viewers = streamRelayManager.getChannelClientsCount(channelId);
  logger.info(`[Broadcast] Status queried for channel ${channelId} by client [IP: ${clientIp}]: ${isActive ? 'Active' : 'Not created'} (${viewers} viewers)`);
  res.json({
    channelId,
    active: isActive,
    viewersCount: viewers,
  });
});

/**
 * GET /api/streams/relay/:channelId
 * Multiplexed Stream Relay:
 * The backend first checks if a broadcast is already created for the TV channel.
 * If yes: simply connects the client to it.
 * If not: creates a new broadcaster on the TV channel.
 * Everything is logged with client IP.
 */
streamsRouter.get('/relay/:channelId', async (req: Request<{ channelId: string }>, res: Response) => {
  const channelId = String(req.params.channelId);
  try {
    await streamRelayManager.handleClientStream(channelId, req, res);
  } catch (err: any) {
    const clientIp = getClientIp(req);
    logger.error(`[StreamRoute] Unexpected error relaying broadcast for channel ${channelId} (Client [IP: ${clientIp}]):`, err);
    if (!res.headersSent && !res.writableEnded) {
      res.status(500).json({ error: 'Internal broadcast relay error' });
    }
  }
});

/**
 * GET /api/streams/status
 * Health & monitoring for active multiplexed streams
 */
streamsRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    activeStreamsCount: streamRelayManager.getActiveStreamsCount(),
  });
});
