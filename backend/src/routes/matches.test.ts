import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Step 3: Football Matches API Integration Tests', () => {
  const app = createApp();

  describe('GET /api/matches', () => {
    it('returns matches grouped by competition and sorted by kickoff time', async () => {
      const res = await request(app).get('/api/matches');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('date');
      expect(res.body).toHaveProperty('totalMatches');
      expect(res.body).toHaveProperty('groups');
      expect(Array.isArray(res.body.groups)).toBe(true);
      expect(res.body.totalMatches).toBeGreaterThan(0);

      // Verify competition grouping
      const firstGroup = res.body.groups[0];
      expect(firstGroup).toHaveProperty('competition');
      expect(firstGroup).toHaveProperty('matches');
      expect(Array.isArray(firstGroup.matches)).toBe(true);

      // Verify matches in first group are sorted by kickoffTime
      if (firstGroup.matches.length > 1) {
        const time1 = new Date(firstGroup.matches[0].kickoffTime).getTime();
        const time2 = new Date(firstGroup.matches[1].kickoffTime).getTime();
        expect(time1).toBeLessThanOrEqual(time2);
      }
    });

    it('supports date query parameter ?date=YYYY-MM-DD', async () => {
      const targetDate = '2026-11-20';
      const res = await request(app).get(`/api/matches?date=${targetDate}`);
      expect(res.status).toBe(200);
      expect(res.body.date).toBe(targetDate);
    });
  });

  describe('GET /api/matches/:id', () => {
    it('returns full match details for an existing match id', async () => {
      const res = await request(app).get('/api/matches/ucl-rm-mci');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ucl-rm-mci');
      expect(res.body.homeTeam.name).toBe('Real Madrid');
      expect(res.body.awayTeam.name).toBe('Manchester City');
      expect(res.body.status).toBe('live');
      expect(res.body.score).toEqual({ home: 2, away: 2 });
      expect(res.body.scorers.length).toBeGreaterThan(0);
      expect(res.body.redCards.length).toBeGreaterThan(0);
    });

    it('returns 404 for non-existent match id', async () => {
      const res = await request(app).get('/api/matches/unknown-match-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Match not found');
    });
  });

  describe('GET /api/matches/:id/lineups', () => {
    it('returns football pitch lineups with 11 starters, coach, and substitutes', async () => {
      const res = await request(app).get('/api/matches/ucl-rm-mci/lineups');
      expect(res.status).toBe(200);
      expect(res.body.home.startingXI).toHaveLength(11);
      expect(res.body.away.startingXI).toHaveLength(11);
      expect(res.body.home.coach).toBeDefined();
      expect(res.body.home.substitutes.length).toBeGreaterThan(0);

      // Verify pitch coordinates are valid percentages (0-100)
      const firstPlayer = res.body.home.startingXI[0];
      expect(firstPlayer.gridX).toBeGreaterThanOrEqual(0);
      expect(firstPlayer.gridX).toBeLessThanOrEqual(100);
      expect(firstPlayer.gridY).toBeGreaterThanOrEqual(0);
      expect(firstPlayer.gridY).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/matches/:id/stats', () => {
    it('returns in-game statistics for live or finished matches', async () => {
      const res = await request(app).get('/api/matches/ucl-rm-mci/stats');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('live');
      expect(res.body.possession.home + res.body.possession.away).toBe(100);
      expect(res.body.totalShots).toBeDefined();
      expect(res.body.cornerKicks).toBeDefined();
      expect(res.body.yellowCards).toBeDefined();
      expect(res.body.redCards).toBeDefined();
    });

    it('returns previous 5 games form for upcoming matches', async () => {
      const res = await request(app).get('/api/matches/epl-liv-che/stats');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('upcoming');
      expect(res.body.home.past5Games).toHaveLength(5);
      expect(res.body.away.past5Games).toHaveLength(5);
      expect(res.body.home.goalsScored).toBeDefined();
      expect(res.body.home.expectedGoals).toBeDefined();
    });
  });
});
