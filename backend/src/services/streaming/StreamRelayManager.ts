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
  private pendingBroadcasters = new Map<string, Promise<ActiveStream>>();

  /**
   * Checks if a live broadcast is currently running for the specified channel ID.
   */
  isBroadcastActive(channelId: string): boolean {
    return this.activeStreams.has(channelId);
  }

  /**
   * Returns the count of active viewer responses listening to a channel broadcast.
   */
  getChannelClientsCount(channelId: string): number {
    return this.activeStreams.get(channelId)?.clients.size || 0;
  }

  /**
   * Total number of active multiplexed upstream broadcasts.
   */
  getActiveStreamsCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Handles incoming client request to stream a TV channel:
   * 1. Checks if a broadcast is already created for the TV channel.
   * 2. If YES: Connects client directly to existing broadcast relay.
   * 3. If NO: Creates a new broadcaster connected to upstream IPTV service.
   * Everything is logged with client IP, response times, chunks, and disconnections.
   */
  async handleClientStream(channelId: string, req: Request, res: Response): Promise<void> {
    const clientIp = getClientIp(req);
    const clientConnectedAt = Date.now();

    // 1. Initial incoming request log
    logger.info(`[Broadcast] Incoming stream request for channel ${channelId} from client [IP: ${clientIp}]`);

    if (!channelId || channelId === 'undefined' || channelId.trim() === '') {
      logger.warn(`[Broadcast] Stream request rejected: missing or invalid channel ID "${channelId}" from client [IP: ${clientIp}]`);
      res.status(400).json({ error: 'Missing or invalid channel ID' });
      return;
    }

    // 2. First check if a broadcast is already created for the TV channel
    logger.info(`[Broadcast] Checking if broadcast is already created for channel ${channelId}...`);

    let stream = this.activeStreams.get(channelId);

    // Case A: Broadcast already created and active -> simply connect to it
    if (stream) {
      const activeListeners = stream.clients.size + 1;
      logger.info(
        `[Broadcast] Active broadcast FOUND for channel ${channelId}. Connecting client [IP: ${clientIp}] to existing broadcaster. Total viewers: ${activeListeners}`
      );

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.clients.add(res);
      this.setupClientDisconnect(channelId, res, req, clientIp, clientConnectedAt);
      return;
    }

    // Case B: Broadcaster creation is currently in-flight by another client -> join pending creation
    if (this.pendingBroadcasters.has(channelId)) {
      logger.info(
        `[Broadcast] Broadcaster creation already in-flight for channel ${channelId}. Client [IP: ${clientIp}] waiting to attach upon creation...`
      );
      try {
        stream = await this.pendingBroadcasters.get(channelId)!;
        const activeListeners = stream.clients.size + 1;
        logger.info(
          `[Broadcast] Broadcaster ready. Connecting waiting client [IP: ${clientIp}] to channel ${channelId}. Total viewers: ${activeListeners}`
        );

        res.setHeader('Content-Type', 'video/mp2t');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        stream.clients.add(res);
        this.setupClientDisconnect(channelId, res, req, clientIp, clientConnectedAt);
        return;
      } catch (err: any) {
        logger.error(`[Broadcast] In-flight broadcast creation failed for channel ${channelId} (Client [IP: ${clientIp}]): ${err.message}`);
        if (!res.headersSent && !res.writableEnded) {
          res.status(502).json({ error: `Upstream broadcast for channel ${channelId} unavailable.` });
        }
        return;
      }
    }

    // Case C: No broadcast exists -> create a new broadcaster on the TV channel
    logger.info(`[Broadcast] No broadcast found for channel ${channelId}. Creating new broadcaster on TV channel...`);

    const safeUpstreamUrl = `${config.XTREAM_URL}/live/${config.XTREAM_USERNAME}/****/${channelId}.ts`;
    const upstreamUrl = `${config.XTREAM_URL}/live/${config.XTREAM_USERNAME}/${config.XTREAM_PASSWORD}/${channelId}.ts`;
    const abortController = new AbortController();
    const createStartTime = Date.now();

    logger.info(
      `[Broadcast] Initiating upstream IPTV connection for channel ${channelId} (Target: ${safeUpstreamUrl}, Initiator [IP: ${clientIp}])`
    );

    const broadcasterPromise = (async (): Promise<ActiveStream> => {
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
        const contentType = response.headers['content-type'] ? String(response.headers['content-type']) : 'video/mp2t';

        // Log IPTV response
        logger.info(
          `[Broadcast] IPTV service responded for channel ${channelId}: Status ${response.status} ${response.statusText || 'OK'} (${responseTimeMs}ms) [Content-Type: ${contentType}]`,
          {
            channelId,
            statusCode: response.status,
            statusText: response.statusText || 'OK',
            responseTimeMs,
            contentType,
            server: response.headers['server'],
            transferEncoding: response.headers['transfer-encoding'],
          }
        );

        const newStream: ActiveStream = {
          channelId,
          abortController,
          clients: new Set<Response>(),
          startedAt: new Date(),
          bytesRelayed: 0,
        };

        this.activeStreams.set(channelId, newStream);
        logger.info(
          `[Broadcast] New broadcaster successfully created for channel ${channelId}. Broadcaster is now active and relaying feed.`
        );

        let firstChunkLogged = false;

        response.data.on('data', (chunk: Buffer) => {
          if (!firstChunkLogged) {
            firstChunkLogged = true;
            const ttfb = Date.now() - createStartTime;
            logger.info(
              `[Broadcast] IPTV first data chunk received for channel ${channelId}: ${chunk.length} bytes (TTFB: ${ttfb}ms)`
            );
          }

          newStream.bytesRelayed += chunk.length;
          for (const client of newStream.clients) {
            if (!client.writableEnded) {
              client.write(chunk);
            }
          }
        });

        response.data.on('end', () => {
          const lifetimeSec = Math.round((Date.now() - newStream.startedAt.getTime()) / 1000);
          logger.info(
            `[Broadcast] Upstream IPTV broadcast ended by server for channel ${channelId} (Lifetime: ${lifetimeSec}s, Relayed: ${newStream.bytesRelayed} bytes)`
          );
          this.cleanupStream(channelId, 'Upstream ended by server');
        });

        response.data.on('error', (err: any) => {
          logger.error(`[Broadcast] Upstream IPTV broadcast stream error for channel ${channelId}:`, {
            channelId,
            error: err.message,
            errorCode: err.code,
          });
          this.cleanupStream(channelId, 'Upstream stream error');
        });

        return newStream;
      } catch (err: any) {
        const responseTimeMs = Date.now() - createStartTime;
        if (err.response) {
          logger.error(
            `[Broadcast] IPTV service returned error response for channel ${channelId}: Status ${err.response.status} ${err.response.statusText || ''} (${responseTimeMs}ms)`,
            {
              channelId,
              clientIp,
              targetUrl: safeUpstreamUrl,
              statusCode: err.response.status,
              statusText: err.response.statusText,
              responseTimeMs,
              headers: err.response.headers,
              data: err.response.data ? String(err.response.data).slice(0, 300) : undefined,
            }
          );
        } else {
          logger.error(
            `[Broadcast] IPTV service connection failed for channel ${channelId} (${responseTimeMs}ms): ${err.message}`,
            {
              channelId,
              clientIp,
              targetUrl: safeUpstreamUrl,
              errorMessage: err.message,
              errorCode: err.code,
              responseTimeMs,
            }
          );
        }
        throw err;
      } finally {
        this.pendingBroadcasters.delete(channelId);
      }
    })();

    this.pendingBroadcasters.set(channelId, broadcasterPromise);

    try {
      stream = await broadcasterPromise;

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.clients.add(res);
      logger.info(
        `[Broadcast] Client [IP: ${clientIp}] connected as initial viewer to channel ${channelId}. (Total viewers: ${stream.clients.size})`
      );

      this.setupClientDisconnect(channelId, res, req, clientIp, clientConnectedAt);
    } catch (err: any) {
      if (!res.headersSent && !res.writableEnded) {
        res.status(502).json({
          error: `Upstream IPTV broadcast for channel ${channelId} unavailable.`,
          detail: err.message,
        });
      }
      this.cleanupStream(channelId, 'Creation failed');
    }
  }

  private setupClientDisconnect(
    channelId: string,
    res: Response,
    req: Request,
    clientIp: string,
    connectedAt: number
  ) {
    req.on('close', () => {
      const clientDurationSec = Math.round((Date.now() - connectedAt) / 1000);
      const currentStream = this.activeStreams.get(channelId);
      const remainingListeners = currentStream ? currentStream.clients.size - 1 : 0;

      logger.info(
        `[Broadcast] Client disconnected: [IP: ${clientIp}] <- Channel ${channelId} (Connected: ${clientDurationSec}s, Stream bytes: ${currentStream?.bytesRelayed || 0}, Remaining viewers: ${remainingListeners})`
      );

      if (currentStream) {
        currentStream.clients.delete(res);
        if (currentStream.clients.size === 0) {
          logger.info(`[Broadcast] Zero viewers remaining for channel ${channelId}. Tearing down and destroying broadcaster.`);
          this.cleanupStream(channelId, 'All clients disconnected');
        }
      }
    });
  }

  private cleanupStream(channelId: string, reason: string = 'Normal cleanup') {
    const stream = this.activeStreams.get(channelId);
    if (stream) {
      const lifetimeSec = Math.round((Date.now() - stream.startedAt.getTime()) / 1000);
      logger.info(
        `[Broadcast] Broadcaster destroyed for channel ${channelId} (Reason: ${reason}, Lifetime: ${lifetimeSec}s, Relayed: ${stream.bytesRelayed} bytes, Viewers: ${stream.clients.size})`
      );
      stream.abortController.abort();
      for (const client of stream.clients) {
        if (!client.writableEnded) {
          client.end();
        }
      }
      this.activeStreams.delete(channelId);
    }
  }
}

export const streamRelayManager = new StreamRelayManager();
