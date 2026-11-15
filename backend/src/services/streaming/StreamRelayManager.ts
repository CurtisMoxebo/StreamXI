import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../../config/env.js';

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
   * Connects directly to upstream Xtream IPTV using the channel stream ID.
   * If the channel cannot be reached or fails, gracefully terminates with 502 Bad Gateway.
   */
  async handleClientStream(channelId: string, req: Request, res: Response): Promise<void> {
    let stream = this.activeStreams.get(channelId);

    // If an upstream stream is already actively relaying, attach this client to it
    if (stream) {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.clients.add(res);

      req.on('close', () => {
        const currentStream = this.activeStreams.get(channelId);
        if (currentStream) {
          currentStream.clients.delete(res);
          if (currentStream.clients.size === 0) {
            this.cleanupStream(channelId);
          }
        }
      });
      return;
    }

    // Try connecting to upstream Xtream IPTV
    const upstreamUrl = `${config.XTREAM_URL}/live/${config.XTREAM_USERNAME}/${config.XTREAM_PASSWORD}/${channelId}.ts`;
    const abortController = new AbortController();

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

      stream = {
        channelId,
        abortController,
        clients: new Set<Response>(),
        startedAt: new Date(),
        bytesRelayed: 0,
      };
      this.activeStreams.set(channelId, stream);
      stream.clients.add(res);

      const contentType = response.headers['content-type'] ? String(response.headers['content-type']) : 'video/mp2t';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.data.on('data', (chunk: Buffer) => {
        if (stream) stream.bytesRelayed += chunk.length;
        for (const client of stream!.clients) {
          if (!client.writableEnded) {
            client.write(chunk);
          }
        }
      });

      response.data.on('end', () => {
        this.cleanupStream(channelId);
      });

      response.data.on('error', (err: any) => {
        console.error(`[StreamRelay] Stream error for ${channelId}:`, err);
        this.cleanupStream(channelId);
      });

      req.on('close', () => {
        const currentStream = this.activeStreams.get(channelId);
        if (currentStream) {
          currentStream.clients.delete(res);
          if (currentStream.clients.size === 0) {
            this.cleanupStream(channelId);
          }
        }
      });
    } catch (err: any) {
      console.error(`[StreamRelayManager] Upstream IPTV connection failed for channel ${channelId}:`, err.message);
      if (!res.headersSent && !res.writableEnded) {
        res.status(502).json({ error: `Upstream IPTV broadcast for channel ${channelId} unavailable.` });
      }
      this.cleanupStream(channelId);
    }
  }

  private cleanupStream(channelId: string) {
    const stream = this.activeStreams.get(channelId);
    if (stream) {
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
