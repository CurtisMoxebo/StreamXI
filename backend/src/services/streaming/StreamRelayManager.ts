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
   * Attaches an Express response to a multiplexed stream relay for the given channel.
   * If an upstream connection already exists for this channel, the client is attached to it.
   * If not, a new upstream connection is created and subsequent clients share it.
   */
  async handleClientStream(channelId: string, req: Request, res: Response): Promise<void> {
    // Set streaming headers
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let stream = this.activeStreams.get(channelId);

    if (!stream) {
      // Start new upstream relay
      const abortController = new AbortController();
      stream = {
        channelId,
        abortController,
        clients: new Set<Response>(),
        startedAt: new Date(),
        bytesRelayed: 0,
      };
      this.activeStreams.set(channelId, stream);

      this.startUpstreamConnection(stream).catch((err) => {
        console.error(`[StreamRelayManager] Upstream error for channel ${channelId}:`, err);
        this.cleanupStream(channelId);
      });
    }

    // Attach client to active stream
    stream.clients.add(res);

    // Clean up when client disconnects
    req.on('close', () => {
      const currentStream = this.activeStreams.get(channelId);
      if (currentStream) {
        currentStream.clients.delete(res);
        if (currentStream.clients.size === 0) {
          // No more active listeners for this channel; terminate upstream
          this.cleanupStream(channelId);
        }
      }
    });
  }

  private async startUpstreamConnection(stream: ActiveStream) {
    const upstreamUrl = `${config.XTREAM_URL}/live/${config.XTREAM_USERNAME}/${config.XTREAM_PASSWORD}/${stream.channelId}`;

    try {
      const response = await axios({
        method: 'GET',
        url: upstreamUrl,
        responseType: 'stream',
        signal: stream.abortController.signal,
        timeout: 10000,
      });

      response.data.on('data', (chunk: Buffer) => {
        stream.bytesRelayed += chunk.length;
        for (const client of stream.clients) {
          if (!client.writableEnded) {
            client.write(chunk);
          }
        }
      });

      response.data.on('end', () => {
        this.cleanupStream(stream.channelId);
      });

      response.data.on('error', (err: any) => {
        console.error(`[StreamRelay] Stream error for ${stream.channelId}:`, err);
        this.cleanupStream(stream.channelId);
      });
    } catch (err) {
      // If upstream Xtream server is unreachable (e.g. dummy credentials in dev or network outage),
      // gracefully end client responses without crashing the server.
      for (const client of stream.clients) {
        if (!client.writableEnded) {
          client.status(502).end('Upstream IPTV relay unavailable.');
        }
      }
      this.cleanupStream(stream.channelId);
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
