import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../../config/env.js';
import { logger, getClientIp } from '../../utils/logger.js';

interface ActiveStream {
  channelId: string;
  abortController: AbortController;
  clients: Set<Response>;
  startedAt: Date;
  bytesRelayed: number;
}

export class StreamRelayManager {
  private activeStreams = new Map<string, ActiveStream>();

  /**
   * Attaches an Express response to a multiplexed stream relay for the given IPTV channel.
   * Logs all attempts to create, connect, and disconnect broadcasts, along with upstream IPTV responses.
   * If the channel cannot be reached or fails, gracefully terminates with 502 Bad Gateway.
   */
  async handleClientStream(channelId: string, req: Request, res: Response): Promise<void> {
    const clientIp = getClientIp(req);
    const clientConnectedAt = Date.now();

    // 1. Log attempt to connect to a broadcast
    logger.info(`[Broadcast] Client connection attempt: [IP: ${clientIp}] -> Channel: ${channelId}`);

    if (!channelId || channelId === 'undefined' || channelId.trim() === '') {
      logger.warn(`[Broadcast] Connection attempt rejected: missing or invalid channel ID "${channelId}" from [IP: ${clientIp}]`);
      res.status(400).json({ error: 'Missing or invalid channel ID' });
      return;
    }

    let stream = this.activeStreams.get(channelId);

    // 2. If an upstream broadcast is already active, attach client to it
    if (stream) {
      const activeListeners = stream.clients.size + 1;
      logger.info(`[Broadcast] Client connected to existing broadcast relay: [IP: ${clientIp}] -> Channel: ${channelId} (Active listeners: ${activeListeners})`);

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.clients.add(res);

      req.on('close', () => {
        const clientDurationSec = Math.round((Date.now() - clientConnectedAt) / 1000);
        const currentStream = this.activeStreams.get(channelId);
        const remainingListeners = currentStream ? currentStream.clients.size - 1 : 0;

        logger.info(
          `[Broadcast] Client disconnected: [IP: ${clientIp}] <- Channel: ${channelId} (Connected: ${clientDurationSec}s, Stream bytes relayed: ${currentStream?.bytesRelayed || 0}, Remaining listeners: ${remainingListeners})`
        );

        if (currentStream) {
          currentStream.clients.delete(res);
          if (currentStream.clients.size === 0) {
            logger.info(`[Broadcast] No remaining listeners for channel: ${channelId}. Tearing down upstream broadcast.`);
            this.cleanupStream(channelId, 'All clients disconnected');
          }
        }
      });
      return;
    }

    // 3. Attempt to CREATE a new broadcast upstream
    const safeUpstreamUrl = `${config.XTREAM_URL}/live/${config.XTREAM_USERNAME}/****/${channelId}.ts`;
    const upstreamUrl = `${config.XTREAM_URL}/live/${config.XTREAM_USERNAME}/${config.XTREAM_PASSWORD}/${channelId}.ts`;
    const abortController = new AbortController();
    const createStartTime = Date.now();

    logger.info(`[Broadcast] Attempting to create upstream broadcast for channel: ${channelId} (Target: ${safeUpstreamUrl}, Initiated by [IP: ${clientIp}])`);

    try {
      const response = await axios({
        method: 'GET',
        url: upstreamUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'IPTVSmartersPro',
        },
        signal: abortController.signal,
        timeout: 10000,
      });

      const responseTimeMs = Date.now() - createStartTime;

      // 4. Log IPTV upstream response (success)
      logger.info(`[Broadcast] IPTV upstream responded for channel ${channelId}: status ${response.status} ${response.statusText || 'OK'} (${responseTimeMs}ms)`, {
        channelId,
        statusCode: response.status,
        statusText: response.statusText || 'OK',
        responseTimeMs,
        contentType: response.headers['content-type'],
        server: response.headers['server'],
        transferEncoding: response.headers['transfer-encoding'],
      });

      stream = {
        channelId,
        abortController,
        clients: new Set<Response>(),
        startedAt: new Date(),
        bytesRelayed: 0,
      };
      this.activeStreams.set(channelId, stream);
      stream.clients.add(res);

      logger.info(`[Broadcast] Upstream broadcast successfully created: Channel ${channelId} (Client [IP: ${clientIp}] attached as initial listener)`);

      const contentType = response.headers['content-type'] ? String(response.headers['content-type']) : 'video/mp2t';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let firstChunkLogged = false;

      response.data.on('data', (chunk: Buffer) => {
        if (!firstChunkLogged) {
          firstChunkLogged = true;
          const firstChunkTime = Date.now() - createStartTime;
          logger.info(`[Broadcast] IPTV first data chunk received for channel ${channelId}: ${chunk.length} bytes (TTFB: ${firstChunkTime}ms)`);
        }

        if (stream) stream.bytesRelayed += chunk.length;
        for (const client of stream!.clients) {
          if (!client.writableEnded) {
            client.write(chunk);
          }
        }
      });

      response.data.on('end', () => {
        const streamLifetimeSec = stream ? Math.round((Date.now() - stream.startedAt.getTime()) / 1000) : 0;
        logger.info(`[Broadcast] Upstream broadcast stream ended by IPTV server for channel: ${channelId} (Lifetime: ${streamLifetimeSec}s, Total bytes relayed: ${stream?.bytesRelayed || 0})`);
        this.cleanupStream(channelId, 'Upstream ended by server');
      });

      response.data.on('error', (err: any) => {
        logger.error(`[Broadcast] Upstream broadcast data stream error for channel ${channelId}:`, {
          channelId,
          error: err.message,
          errorCode: err.code,
        });
        this.cleanupStream(channelId, 'Upstream stream error');
      });

      req.on('close', () => {
        const clientDurationSec = Math.round((Date.now() - clientConnectedAt) / 1000);
        const currentStream = this.activeStreams.get(channelId);
        const remainingListeners = currentStream ? currentStream.clients.size - 1 : 0;

        logger.info(
          `[Broadcast] Client disconnected: [IP: ${clientIp}] <- Channel: ${channelId} (Connected: ${clientDurationSec}s, Stream bytes relayed: ${currentStream?.bytesRelayed || 0}, Remaining listeners: ${remainingListeners})`
        );

        if (currentStream) {
          currentStream.clients.delete(res);
          if (currentStream.clients.size === 0) {
            logger.info(`[Broadcast] No remaining listeners for channel: ${channelId}. Tearing down upstream broadcast.`);
            this.cleanupStream(channelId, 'All clients disconnected');
          }
        }
      });
    } catch (err: any) {
      const responseTimeMs = Date.now() - createStartTime;

      // 5. Log IPTV upstream response (error)
      if (err.response) {
        logger.error(`[Broadcast] IPTV upstream responded with error for channel ${channelId}: status ${err.response.status} ${err.response.statusText || ''} (${responseTimeMs}ms)`, {
          channelId,
          clientIp,
          targetUrl: safeUpstreamUrl,
          statusCode: err.response.status,
          statusText: err.response.statusText,
          responseTimeMs,
          headers: err.response.headers,
          data: err.response.data ? String(err.response.data).slice(0, 300) : undefined,
        });
      } else {
        logger.error(`[Broadcast] IPTV upstream connection attempt failed for channel ${channelId} (${responseTimeMs}ms):`, {
          channelId,
          clientIp,
          targetUrl: safeUpstreamUrl,
          errorMessage: err.message,
          errorCode: err.code,
          responseTimeMs,
        });
      }

      if (!res.headersSent && !res.writableEnded) {
        res.status(502).json({
          error: `Upstream IPTV broadcast for channel ${channelId} unavailable.`,
          detail: err.message,
        });
      }
      this.cleanupStream(channelId, 'Creation failed');
    }
  }

  private cleanupStream(channelId: string, reason: string = 'Normal cleanup') {
    const stream = this.activeStreams.get(channelId);
    if (stream) {
      const lifetimeSec = Math.round((Date.now() - stream.startedAt.getTime()) / 1000);
      logger.info(`[Broadcast] Disconnecting and cleaning up broadcast for channel: ${channelId} (Reason: ${reason}, Lifetime: ${lifetimeSec}s, Bytes: ${stream.bytesRelayed}, Listeners: ${stream.clients.size})`);
      stream.abortController.abort();
      for (const client of stream.clients) {
        if (!client.writableEnded) {
          client.end();
        }
      }
      this.activeStreams.delete(channelId);
    }
  }

  getActiveStreamsCount(): number {
    return this.activeStreams.size;
  }

  getChannelClientsCount(channelId: string): number {
    return this.activeStreams.get(channelId)?.clients.size || 0;
  }
}

export const streamRelayManager = new StreamRelayManager();
