import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Step 4: Gemini AI Match Insights Integration Tests (Tab 3)', () => {
  const app = createApp();

  it('GET /api/matches/:id/ai-insights returns probabilities, 2 low-risk, 2 high-risk bets & analytical summary for live match', async () => {
    const res = await request(app).get('/api/matches/ucl-rm-mci/ai-insights');
    expect(res.status).toBe(200);
    expect(res.body.matchId).toBe('ucl-rm-mci');
    expect(res.body.model).toBe('gemini-3.5-flash-lite');

    // Win/Draw Probabilities
    const { homeWin, draw, awayWin } = res.body.probabilities;
    expect(typeof homeWin).toBe('number');
    expect(typeof draw).toBe('number');
    expect(typeof awayWin).toBe('number');
    expect(homeWin + draw + awayWin).toBe(100);

    // 2 Low Risk Bets
    expect(res.body.lowRiskBets).toHaveLength(2);
    expect(res.body.lowRiskBets[0].risk).toBe('low');
    expect(res.body.lowRiskBets[0].confidence).toBeGreaterThanOrEqual(70);
    expect(res.body.lowRiskBets[1].risk).toBe('low');

    // 2 High Risk Bets
    expect(res.body.highRiskBets).toHaveLength(2);
    expect(res.body.highRiskBets[0].risk).toBe('high');
    expect(res.body.highRiskBets[1].risk).toBe('high');

    // Exactly one analytical paragraph
    expect(typeof res.body.analyticalSummary).toBe('string');
    expect(res.body.analyticalSummary.length).toBeGreaterThan(50);
  }, 30000);

  it('GET /api/matches/:id/ai-insights works for upcoming matches', async () => {
    const res = await request(app).get('/api/matches/epl-liv-che/ai-insights');
    expect(res.status).toBe(200);
    expect(res.body.lowRiskBets).toHaveLength(2);
    expect(res.body.highRiskBets).toHaveLength(2);
  }, 30000);

  it('GET /api/matches/:id/ai-insights returns 400 Bad Request for finished matches', async () => {
    const res = await request(app).get('/api/matches/epl-tot-mun/ai-insights');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('only available for upcoming or live matches');
  });

  it('GET /api/matches/:id/ai-insights returns 404 for non-existent match', async () => {
    const res = await request(app).get('/api/matches/fake-id-123/ai-insights');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Match not found');
  });
});
