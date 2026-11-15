import { Router, Request, Response } from 'express';
import { xtreamService } from '../services/streaming/XtreamService.js';
import { streamRelayManager } from '../services/streaming/StreamRelayManager.js';

export const streamsRouter = Router();

/**
 * GET /api/streams/matches/:id
 * Returns stream availability status & TV channel list (France, England, Spain, host country)
 */
streamsRouter.get('/matches/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const streamInfo = await xtreamService.getMatchStreamInfo(String(req.params.id));
    res.json(streamInfo);
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error(`Error fetching stream info for match ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve stream info' });
  }
});

/**
 * GET /api/streams/relay/:channelId
 * Multiplexed Stream Relay:
 * The backend creates a single upstream connection to Xtream IPTV.
 * Multiple simultaneous viewers connect to the existing backend stream.
 */
streamsRouter.get('/relay/:channelId', async (req: Request<{ channelId: string }>, res: Response) => {
  const channelId = String(req.params.channelId);
  await streamRelayManager.handleClientStream(channelId, req, res);
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
