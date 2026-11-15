import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env (one .env for frontend, backend, and docker)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also fallback to backend/.env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_PORT: z.coerce.number().default(Number(process.env.PORT) || 5000),
  PORT: z.coerce.number().default(Number(process.env.BACKEND_PORT) || 5000),
  DOMAIN: z.string().default('streamxi.moxebocurtis.com'),
  
  // Gemini AI
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  
  // Xtream Codes IPTV Credentials
  XTREAM_URL: z.string().default('http://iptv.example.com:8080'),
  XTREAM_USERNAME: z.string().default('demo_user'),
  XTREAM_PASSWORD: z.string().default('demo_pass'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config: EnvConfig = envSchema.parse(process.env);
