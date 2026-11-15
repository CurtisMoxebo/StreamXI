import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getClientIp, cleanIp, logger } from '../src/utils/logger.js';

describe('Backend Logging System & Client IP Detection', () => {
  describe('cleanIp', () => {
    it('normalizes IPv6 loopback to 127.0.0.1', () => {
      expect(cleanIp('::1')).toBe('127.0.0.1');
    });

    it('strips ::ffff: prefix from IPv4-mapped IPv6 addresses', () => {
      expect(cleanIp('::ffff:192.168.1.50')).toBe('192.168.1.50');
      expect(cleanIp('::ffff:10.0.0.1')).toBe('10.0.0.1');
    });

    it('preserves clean IPv4 addresses', () => {
      expect(cleanIp('203.0.113.195')).toBe('203.0.113.195');
    });

    it('returns 127.0.0.1 for empty or undefined input', () => {
      expect(cleanIp('')).toBe('127.0.0.1');
    });
  });

  describe('getClientIp', () => {
    it('extracts client IP from Cloudflare CF-Connecting-IP header', () => {
      const mockReq: any = {
        headers: { 'cf-connecting-ip': '198.51.100.42' },
      };
      expect(getClientIp(mockReq)).toBe('198.51.100.42');
    });

    it('extracts original client IP from X-Forwarded-For header with multiple proxies', () => {
      const mockReq: any = {
        headers: { 'x-forwarded-for': '203.0.113.195, 10.0.0.1, 172.16.0.1' },
      };
      expect(getClientIp(mockReq)).toBe('203.0.113.195');
    });

    it('extracts client IP from X-Real-IP header', () => {
      const mockReq: any = {
        headers: { 'x-real-ip': '192.0.2.1' },
      };
      expect(getClientIp(mockReq)).toBe('192.0.2.1');
    });

    it('falls back to req.ip when headers are absent', () => {
      const mockReq: any = {
        headers: {},
        ip: '::ffff:172.20.10.5',
      };
      expect(getClientIp(mockReq)).toBe('172.20.10.5');
    });

    it('falls back to socket.remoteAddress when req.ip is not available', () => {
      const mockReq: any = {
        headers: {},
        socket: { remoteAddress: '192.168.0.25' },
      };
      expect(getClientIp(mockReq)).toBe('192.168.0.25');
    });
  });

  describe('HTTP Request Logging Middleware', () => {
    const app = createApp();

    it('logs incoming requests with client IP address', async () => {
      const httpSpy = vi.spyOn(logger, 'http');

      const res = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', '198.51.100.88');

      expect(res.status).toBe(200);
      expect(httpSpy).toHaveBeenCalled();

      // Check that the request passed to logger.http has the expected client IP
      const loggedReq = httpSpy.mock.calls[0][0];
      expect(getClientIp(loggedReq)).toBe('198.51.100.88');

      httpSpy.mockRestore();
    });

    it('logs 404 responses with client IP address', async () => {
      const httpSpy = vi.spyOn(logger, 'http');

      const res = await request(app)
        .get('/api/not-found-endpoint')
        .set('X-Real-IP', '203.0.113.77');

      expect(res.status).toBe(404);
      expect(httpSpy).toHaveBeenCalled();

      const loggedReq = httpSpy.mock.calls[0][0];
      expect(getClientIp(loggedReq)).toBe('203.0.113.77');

      httpSpy.mockRestore();
    });
  });

  describe('Logger Methods', () => {
    it('provides info, warn, error, and debug logging methods', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.info('Test Info Message', { detail: 1 });
      logger.warn('Test Warn Message');
      logger.error('Test Error Message', new Error('Test'));

      expect(logSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Broadcast Creation Error Logging', () => {
    const app = createApp();

    it('logs error when trying to create a broadcast with invalid or missing channel ID', async () => {
      const errorSpy = vi.spyOn(logger, 'error');

      const res = await request(app)
        .get('/api/streams/relay/%20')
        .set('X-Forwarded-For', '198.51.100.99');

      expect(res.status).toBe(400);
      expect(errorSpy).toHaveBeenCalled();
      const errorCall = errorSpy.mock.calls.find((call) =>
        call[0].includes('Broadcast creation rejected')
      );
      expect(errorCall).toBeDefined();

      errorSpy.mockRestore();
    });

    it('logs error when upstream IPTV connection fails during broadcast creation', async () => {
      const errorSpy = vi.spyOn(logger, 'error');

      const res = await request(app)
        .get('/api/streams/relay/invalid-channel-9999999')
        .set('X-Forwarded-For', '203.0.113.55');

      expect([502, 504]).toContain(res.status);
      expect(errorSpy).toHaveBeenCalled();

      const failedCall = errorSpy.mock.calls.find((call) =>
        call[0].includes('Failed to create broadcast for channel')
      );
      expect(failedCall).toBeDefined();
      expect(failedCall?.[1]).toMatchObject({
        clientIp: '203.0.113.55',
        channelId: 'invalid-channel-9999999',
      });

      errorSpy.mockRestore();
    });
  });
});
