import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { liveTvService, decodeBase64Safe } from '../src/services/streaming/LiveTvService.js';

describe('Step 6: Live TV & EPG Service and Routes Tests', () => {
  const app = createApp();

  describe('decodeBase64Safe Helper', () => {
    it('decodes base64 strings correctly', () => {
      // "Vivez en direct les évènements de CANAL+" base64 encoded
      const encoded = 'Vml2ZXogZW4gZGlyZWN0IGxlcyDDqXbDqG5lbWVudHMgZGUgQ0FOQUwr';
      expect(decodeBase64Safe(encoded)).toBe('Vivez en direct les évènements de CANAL+');
    });

    it('returns plain text unchanged if not base64', () => {
      expect(decodeBase64Safe('Live Football Broadcast')).toBe('Live Football Broadcast');
      expect(decodeBase64Safe('')).toBe('');
      expect(decodeBase64Safe(undefined as any)).toBe('');
    });
  });

  describe('GET /api/livetv/categories', () => {
    it('returns list of categories with id and name', async () => {
      const res = await request(app).get('/api/livetv/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('name');
      }
    });
  });

  describe('GET /api/livetv/channels', () => {
    it('returns channels grouped by categories', async () => {
      const res = await request(app).get('/api/livetv/channels?limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalGroups');
      expect(Array.isArray(res.body.groups)).toBe(true);

      if (res.body.groups.length > 0) {
        const group = res.body.groups[0];
        expect(group).toHaveProperty('category');
        expect(group.category).toHaveProperty('id');
        expect(group.category).toHaveProperty('name');
        expect(group).toHaveProperty('totalChannels');
        expect(Array.isArray(group.channels)).toBe(true);

        if (group.channels.length > 0) {
          const ch = group.channels[0];
          expect(ch).toHaveProperty('id');
          expect(ch).toHaveProperty('name');
          expect(ch).toHaveProperty('categoryId');
          expect(ch).toHaveProperty('categoryName');
          expect(ch).toHaveProperty('streamUrl');
          expect(ch.streamUrl).toBe(`/api/streams/relay/${ch.id}`);
        }
      }
    });

    it('filters channels and groups by search query (channel name or category name)', async () => {
      const res = await request(app).get('/api/livetv/channels?search=canal');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.groups)).toBe(true);

      for (const group of res.body.groups) {
        const catMatches = group.category.name.toLowerCase().includes('canal');
        const channelMatches = group.channels.some((c: any) =>
          c.name.toLowerCase().includes('canal')
        );
        expect(catMatches || channelMatches).toBe(true);
      }
    });

    it('filters channels by categoryId', async () => {
      // First get all categories to find a valid id
      const catRes = await request(app).get('/api/livetv/categories');
      if (catRes.body.length > 0) {
        const targetCatId = catRes.body[0].id;
        const res = await request(app).get(`/api/livetv/channels?categoryId=${targetCatId}&limit=5`);
        expect(res.status).toBe(200);

        for (const group of res.body.groups) {
          expect(group.category.id).toBe(targetCatId);
          for (const ch of group.channels) {
            expect(ch.categoryId).toBe(targetCatId);
          }
        }
      }
    });
  });

  describe('GET /api/livetv/channels/:channelId & /epg', () => {
    it('returns channel detail with EPG program listing for existing channel', async () => {
      // Use known live stream ID 1562854 (Canal+ Live 1)
      const res = await request(app).get('/api/livetv/channels/1562854');
      if (res.status === 200) {
        expect(res.body).toHaveProperty('id', '1562854');
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('categoryId');
        expect(res.body).toHaveProperty('categoryName');
        expect(res.body).toHaveProperty('streamUrl', '/api/streams/relay/1562854');
        expect(Array.isArray(res.body.epg)).toBe(true);

        if (res.body.epg.length > 0) {
          const prog = res.body.epg[0];
          expect(prog).toHaveProperty('id');
          expect(prog).toHaveProperty('title');
          expect(prog).toHaveProperty('startTimestamp');
          expect(prog).toHaveProperty('stopTimestamp');
          // Verify title is decoded human-readable string, not raw base64
          expect(prog.title).not.toMatch(/^Vml2ZXog/);
        }
      }
    });

    it('returns EPG listings directly from /api/livetv/channels/:channelId/epg', async () => {
      const res = await request(app).get('/api/livetv/channels/1562854/epg');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('startTimestamp');
    });

    it('returns 404 for non-existent channel ID', async () => {
      const res = await request(app).get('/api/livetv/channels/non-existent-channel-99999999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
