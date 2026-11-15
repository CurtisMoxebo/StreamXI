import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { streamRelayManager } from '../src/services/streaming/StreamRelayManager.js';

describe('Step 5: Xtream IPTV Streaming & Multiplexed Relay Tests', () => {
  const app = createApp();

  describe('GET /api/matches/:id/stream-info', () => {
    it('returns "ready" status and >= 3 channels per country for live match', async () => {
      const res = await request(app).get('/api/matches/ucl-rm-mci/stream-info');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.statusMessage).toBeDefined();
      expect(Array.isArray(res.body.channels)).toBe(true);
      expect(res.body.channels.length).toBeGreaterThanOrEqual(9); // at least 3 from FR, 3 from EN, 3 from ES

      // Check country flags
      const frenchChannels = res.body.channels.filter((c: any) => c.country === 'France');
      const englishChannels = res.body.channels.filter((c: any) => c.country === 'England');
      const spanishChannels = res.body.channels.filter((c: any) => c.country === 'Spain');

      expect(frenchChannels.length).toBeGreaterThanOrEqual(3);
      expect(englishChannels.length).toBeGreaterThanOrEqual(3);
      expect(spanishChannels.length).toBeGreaterThanOrEqual(3);

      expect(frenchChannels[0].flag).toBe('🇫🇷');
      expect(englishChannels[0].flag).toBe('🇬🇧');
      expect(spanishChannels[0].flag).toBe('🇪🇸');

      // Check default channel selection
      expect(res.body.activeChannelId).toBe(res.body.channels[0].id);
    });

    it('returns "ended" status indicating game is over for past match', async () => {
      const res = await request(app).get('/api/matches/epl-tot-mun/stream-info');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ended');
      expect(res.body.statusMessage.toLowerCase()).toContain('game is over');
    });

    it('returns 404 for non-existent match id', async () => {
      const res = await request(app).get('/api/matches/not-found-id/stream-info');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/streams/status', () => {
    it('returns active stream monitor status', async () => {
      const res = await request(app).get('/api/streams/status');
      expect(res.status).toBe(200);
      expect(typeof res.body.activeStreamsCount).toBe('number');
    });
  });

  describe('Multiplexed Stream Relay Engine', () => {
    it('tracks active streams count and listeners cleanly', () => {
      expect(streamRelayManager.getActiveStreamsCount()).toBeGreaterThanOrEqual(0);
      expect(streamRelayManager.getChannelClientsCount('non-existent')).toBe(0);
    });
  });
});
