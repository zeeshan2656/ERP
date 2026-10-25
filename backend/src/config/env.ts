import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),

  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('erp_platform_db'),
  DB_CONNECTION_LIMIT: z.coerce.number().default(20),

  JWT_SECRET: z.string().min(16).default('super_secure_jwt_secret_key_lowcode_platform_phase1_2026_xyz987'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string().min(16).default('super_secure_refresh_token_secret_lowcode_platform_phase1_2026_abc123'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  MEDIA_STORAGE_PATH: z.string().default('../storage_data'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  ALLOWED_MIME_TYPES: z.string().default('image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,application/pdf'),

  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Environment configuration validation failed:', parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  // Resolve absolute path for storage directory
  RESOLVED_MEDIA_PATH: path.isAbsolute(parsedEnv.data.MEDIA_STORAGE_PATH)
    ? parsedEnv.data.MEDIA_STORAGE_PATH
    : path.resolve(process.cwd(), parsedEnv.data.MEDIA_STORAGE_PATH),
  ALLOWED_MIME_LIST: parsedEnv.data.ALLOWED_MIME_TYPES.split(',').map((t) => t.trim()),
  CORS_ORIGIN_LIST: parsedEnv.data.CORS_ORIGIN.split(',').map((o) => o.trim()),
};
