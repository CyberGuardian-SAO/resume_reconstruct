/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 数据库连接与共享工具模块
 * 提供 PostgreSQL 连接池、查询助手、用户查询、密码工具等
 */

import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import { Pool } from "pg";

// ─── 数据库连接 ───────────────────────────────────────────────

function buildPostgresConnectionString() {
  if (!process.env.PGHOST && !process.env.DATABASE_URL) return undefined;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = encodeURIComponent(process.env.PGUSER || "postgres");
  const password = process.env.PGPASSWORD;
  const auth = password ? `${user}:${encodeURIComponent(password)}@` : `${user}@`;
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || "5432";
  const database = process.env.PGDATABASE || "resume_reconstruct";
  return `postgresql://${auth}${host}:${port}/${database}`;
}

export const DATABASE_URL = buildPostgresConnectionString();

let _pool: Pool | null = null;

// 返回一个始终返回空结果的伪 Pool，供无数据库时使用
function createNullPool(): Pool {
  const nullQuery = async () => ({ rows: [], rowCount: 0, command: "", oid: 0, fields: [] });
  return { query: nullQuery, connect: nullQuery as any, end: nullQuery as any } as any;
}

function getPool(): Pool {
  if (!_pool) {
    if (!DATABASE_URL) {
      console.warn("No database configured — using null pool. API features requiring DB will fail.");
      _pool = createNullPool();
    } else {
      _pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
      });
    }
  }
  return _pool;
}

export async function query(text: string, params?: any[]) {
  return getPool().query(text, params);
}

// ─── 数据库初始化 ─────────────────────────────────────────────

export async function initDatabase() {
  if (!DATABASE_URL) {
    console.warn("Postgres not configured — skipping database initialization.");
    return;
  }

  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE,
    session_token TEXT UNIQUE,
    password_hash TEXT,
    free_quota INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    sms_code TEXT,
    sms_code_expires TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true
  )`);

  await query(`CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    amount INT NOT NULL,
    status TEXT NOT NULL,
    order_no TEXT UNIQUE NOT NULL,
    trade_no TEXT UNIQUE,
    code_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ,
    used BOOLEAN NOT NULL DEFAULT false
  )`);

  await query(`CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
}

// ─── 用户查询 ─────────────────────────────────────────────────

export async function getUserByToken(token: string) {
  if (!token) return null;
  const result = await query(`SELECT * FROM users WHERE session_token = $1 AND active = true`, [token]);
  return result.rows[0] || null;
}

export async function getUserByPhone(phone: string) {
  const result = await query(`SELECT * FROM users WHERE phone = $1`, [phone]);
  return result.rows[0] || null;
}

// ─── 工具函数 ─────────────────────────────────────────────────

export function createSessionToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function randomHex(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(key));
}

export function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  return cleaned.trim();
}

export function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

export function formatTimestamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function assertEnv(variable: string | undefined, name: string) {
  if (!variable) throw new Error(`${name} is required in environment configuration.`);
  return variable;
}
