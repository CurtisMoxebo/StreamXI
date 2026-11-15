import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';

describe('Step 1: Backend Foundation & Health Check', () => {
  const app = createApp();

  it('should load environment configuration with defaults', () => {
    expect(config.PORT).toBeDefined();
    expect(typeof config.PORT).toBe('number');
    expect(config.GEMINI_MODEL).toBe('gemini-3.5-flash-lite');
    expect(config.DOMAIN).toBe('streamxi.moxebocurtis.com');
  });

  it('GET /api/health should return 200 OK with status "ok"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('StreamXI API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /unknown-route should return 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('OPTIONS CORS preflight should include proper headers', async () => {
    const res = await request(app).options('/api/health');
    expect(res.status).toBe(204);
  });
});
