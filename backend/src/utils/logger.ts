import { Request, Response } from 'express';

// ANSI color codes for readable terminal logging
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Normalizes IPv4 and IPv6 loopback addresses to a clean format.
 */
export function cleanIp(ip: string): string {
  if (!ip) return '127.0.0.1';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
}

/**
 * Accurately extracts the client IP address from request headers, reverse proxies,
 * Cloudflare, Nginx, or socket remote address.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;

  // 1. Cloudflare Connecting IP
  const cfIp = headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cleanIp(cfIp.trim());
  }

  // 2. Standard X-Forwarded-For header (client, proxy1, proxy2...)
  const forwardedFor = headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return cleanIp(firstIp);
  } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return cleanIp(forwardedFor[0].trim());
  }

  // 3. Nginx X-Real-IP
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return cleanIp(realIp.trim());
  }

  // 4. Express req.ip (when trust proxy is enabled)
  if (req.ip) {
    return cleanIp(req.ip);
  }

  // 5. Raw socket remote address
  if (req.socket?.remoteAddress) {
    return cleanIp(req.socket.remoteAddress);
  }

  return '127.0.0.1';
}

export class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string, ...meta: any[]): void {
    const timestamp = this.formatTimestamp();
    const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${colors.green}[INFO]${colors.reset}`;
    if (meta.length > 0) {
      console.log(`${prefix} ${message}`, ...meta);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  warn(message: string, ...meta: any[]): void {
    const timestamp = this.formatTimestamp();
    const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${colors.yellow}[WARN]${colors.reset}`;
    if (meta.length > 0) {
      console.warn(`${prefix} ${message}`, ...meta);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }

  error(message: string, ...meta: any[]): void {
    const timestamp = this.formatTimestamp();
    const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${colors.red}[ERROR]${colors.reset}`;
    if (meta.length > 0) {
      console.error(`${prefix} ${message}`, ...meta);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  debug(message: string, ...meta: any[]): void {
    if (process.env.NODE_ENV === 'test') return;
    const timestamp = this.formatTimestamp();
    const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${colors.blue}[DEBUG]${colors.reset}`;
    if (meta.length > 0) {
      console.debug(`${prefix} ${message}`, ...meta);
    } else {
      console.debug(`${prefix} ${message}`);
    }
  }

  /**
   * Dedicated HTTP request log format displaying client IP address, HTTP method,
   * URL path, status code, and latency in milliseconds.
   */
  http(req: Request, res: Response, durationMs: number): void {
    const timestamp = this.formatTimestamp();
    const clientIp = getClientIp(req);
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;

    // Status code colorization
    let statusColor = colors.green;
    if (statusCode >= 500) statusColor = colors.red;
    else if (statusCode >= 400) statusColor = colors.yellow;
    else if (statusCode >= 300) statusColor = colors.cyan;

    const logLine = `${colors.dim}[${timestamp}]${colors.reset} ${colors.cyan}[HTTP]${colors.reset} ${colors.magenta}[IP: ${clientIp}]${colors.reset} ${colors.bold}${method}${colors.reset} ${url} ${statusColor}${statusCode}${colors.reset} ${colors.dim}(${durationMs}ms)${colors.reset}`;

    if (statusCode >= 500) {
      console.error(logLine);
    } else if (statusCode >= 400) {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  }
}

export const logger = new Logger();
