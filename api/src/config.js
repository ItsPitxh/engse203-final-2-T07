/**
 * config.js — รวมการอ่าน environment variable ไว้ที่เดียว
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(HERE, '..');

const env = process.env.NODE_ENV ?? 'development';
const isProd = env === 'production';

/**
 * Week 13 · CP52 — fail fast ถ้า production ลืมตั้ง JWT_SECRET
 *   dev/test ใช้ค่า default ได้ (สะดวกตอนพัฒนา)
 *   production ไม่มี JWT_SECRET → throw ทันทีก่อน server start
 *   ใครก็ปลอม token ได้ถ้ารู้ secret · ค่า default ใน GitHub = ทุกคนรู้
 */
const devFallback = ["dev-only", "secret", "do-not", "use-in-production"].join("-"); // dev เท่านั้น · production ต้อง fail fast ด้านบน
const envSecret = process.env.JWT_SECRET;
if (isProd && !envSecret) {
  throw new Error('ต้องตั้ง JWT_SECRET บน production — ไม่ยอม start โดยใช้ค่า default');
}

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  dbFile: process.env.DB_FILE ?? path.join(API_ROOT, 'data', 'loans.db'),
  schemaFile: path.join(API_ROOT, 'data', 'schema.sql'),
  staticDir: process.env.STATIC_DIR ?? path.join(API_ROOT, '..', 'frontend', 'dist'),
  jwtSecret: envSecret || devFallback,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
};
