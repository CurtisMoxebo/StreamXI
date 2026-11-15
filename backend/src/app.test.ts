import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { config } from './config/env.js';

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
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/unknown-endpoint should return 404 Not Found', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('should include CORS headers in responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
