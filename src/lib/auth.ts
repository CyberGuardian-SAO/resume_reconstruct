/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 用户认证模块
 * 提供注册、登录、短信验证码、会话中间件等
 */

import express from "express";
import crypto from "crypto";
import axios from "axios";
import { query, getUserByPhone, getUserByToken, createSessionToken, hashPassword, verifyPassword, randomHex, percentEncode, formatTimestamp, assertEnv, DATABASE_URL, initDatabase } from "./db";

// ─── 环境变量 ─────────────────────────────────────────────────

const ALIYUN_SMS_ACCESS_KEY_ID = process.env.ALIYUN_SMS_ACCESS_KEY_ID;
const ALIYUN_SMS_ACCESS_KEY_SECRET = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET;
const ALIYUN_SMS_SIGN_NAME = process.env.ALIYUN_SMS_SIGN_NAME;
const ALIYUN_SMS_TEMPLATE_CODE = process.env.ALIYUN_SMS_TEMPLATE_CODE;

// ─── 中间件 ──────────────────────────────────────────────────

function getSessionToken(req: express.Request) {
  const header = req.headers.authorization;
  if (header && typeof header === "string" && header.startsWith("Bearer ")) {
    return header.replace(/^Bearer\s+/i, "");
  }
  return (req.body as any)?.sessionToken;
}

export async function authenticateSessionOrCreate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getSessionToken(req);

  if (token) {
    const user = await getUserByToken(token);
    if (user) {
      (req as any).user = user;
      next();
      return;
    }
    console.warn("Invalid session token, creating new session.");
  }

  const newToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  try {
    const insertResult = await query(`
      INSERT INTO users (session_token, free_quota, created_at)
      VALUES ($1, $2, now())
      RETURNING id
    `, [newToken, 0]);
    const newUserId = insertResult.rows[0].id;
    (req as any).user = { id: newUserId, sessionToken: newToken, freeQuota: 0 };
    res.setHeader("X-Session-Token", newToken);
    next();
  } catch (error) {
    console.error("Failed to create new user", error);
    return res.status(500).json({ error: "无法创建用户会话" });
  }
}

export async function authenticateSession(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getSessionToken(req);
  if (!token) {
    return res.status(401).json({ error: "缺少 sessionToken 或 Authorization Bearer token" });
  }
  const user = await getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "无效或已过期的 sessionToken" });
  }
  (req as any).user = user;
  next();
}

// ─── 阿里云短信 ──────────────────────────────────────────────

async function sendAliyunSms(phone: string, code: string) {
  assertEnv(ALIYUN_SMS_ACCESS_KEY_ID, "ALIYUN_SMS_ACCESS_KEY_ID");
  assertEnv(ALIYUN_SMS_ACCESS_KEY_SECRET, "ALIYUN_SMS_ACCESS_KEY_SECRET");
  assertEnv(ALIYUN_SMS_SIGN_NAME, "ALIYUN_SMS_SIGN_NAME");
  assertEnv(ALIYUN_SMS_TEMPLATE_CODE, "ALIYUN_SMS_TEMPLATE_CODE");

  const params: Record<string, string> = {
    AccessKeyId: ALIYUN_SMS_ACCESS_KEY_ID!,
    Action: "SendSms",
    Format: "JSON",
    PhoneNumbers: phone,
    RegionId: "cn-hangzhou",
    SignName: ALIYUN_SMS_SIGN_NAME!,
    TemplateCode: ALIYUN_SMS_TEMPLATE_CODE!,
    TemplateParam: JSON.stringify({ code }),
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomHex(16),
    SignatureVersion: "1.0",
    Timestamp: formatTimestamp(new Date()),
    Version: "2017-05-25",
  };

  const sortedKeys = Object.keys(params).sort();
  const canonicalQuery = sortedKeys.map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`).join("&");
  const stringToSign = `POST&${percentEncode("/")}&${percentEncode(canonicalQuery)}`;
  const signature = crypto.createHmac("sha1", `${ALIYUN_SMS_ACCESS_KEY_SECRET}&`).update(stringToSign).digest("base64");
  const requestBody = new URLSearchParams({ ...params, Signature: signature }).toString();

  const response = await axios.post("https://dysmsapi.aliyuncs.com/", requestBody, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (response.data?.Code !== "OK") {
    throw new Error(`Aliyun SMS 发送失败: ${response.data?.Message || JSON.stringify(response.data)}`);
  }
  return response.data;
}

// ─── 路由注册 ─────────────────────────────────────────────────

export function registerAuthRoutes(app: express.Application) {
  // 发送验证码
  app.post("/api/register/send-code", async (req, res) => {
    try {
      const phone = (req.body.phone || "").toString().trim();
      const password = (req.body.password || "").toString().trim();
      const passwordConfirm = (req.body.passwordConfirm || "").toString().trim();
      if (!phone) return res.status(400).json({ error: "请提供手机号。" });
      if (!password || password.length < 6) return res.status(400).json({ error: "密码最低6位。" });
      if (password !== passwordConfirm) return res.status(400).json({ error: "两次输入的密码不一致。" });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const existingUser = await getUserByPhone(phone);
      if (existingUser?.verified_at) {
        return res.status(400).json({ error: "该手机号已注册，仅支持首次验证登记。如需继续使用请更换其他手机号。" });
      }

      const passwordHash = hashPassword(password);
      if (existingUser) {
        await query(`UPDATE users SET sms_code = $1, sms_code_expires = $2, password_hash = $3 WHERE phone = $4`, [code, expiresAt, passwordHash, phone]);
      } else {
        await query(`INSERT INTO users (phone, sms_code, sms_code_expires, password_hash, free_quota) VALUES ($1, $2, $3, $4, 0)`, [phone, code, expiresAt, passwordHash]);
      }

      await sendAliyunSms(phone, code);
      return res.json({ success: true, expiresAt });
    } catch (error: any) {
      console.error("/api/register/send-code error", error);
      return res.status(500).json({ error: error.message || "短信发送失败，请稍后重试。" });
    }
  });

  // 验证码校验 + 注册完成
  app.post("/api/register/verify-code", async (req, res) => {
    try {
      const phone = (req.body.phone || "").toString().trim();
      const code = (req.body.code || "").toString().trim();
      const password = (req.body.password || "").toString().trim();
      if (!phone || !code || !password) return res.status(400).json({ error: "手机号、验证码和密码均为必填。" });
      if (password.length < 6) return res.status(400).json({ error: "密码最低6位。" });

      const user = await getUserByPhone(phone);
      if (!user) return res.status(404).json({ error: "找不到该手机号对应的用户，请先发送验证码。" });
      if (!user.sms_code || !user.sms_code_expires) return res.status(400).json({ error: "验证码未发送或已失效，请重新获取。" });
      if (new Date(user.sms_code_expires) < new Date()) return res.status(400).json({ error: "验证码已过期，请重新发送。" });
      if (user.sms_code !== code) return res.status(400).json({ error: "验证码错误，请重新输入。" });
      if (!user.password_hash || !verifyPassword(password, user.password_hash)) return res.status(400).json({ error: "密码错误，请重新输入。" });

      const sessionToken = createSessionToken();
      const firstVerification = !user.verified_at;
      await query(`UPDATE users SET verified_at = now(), session_token = $1, sms_code = NULL, sms_code_expires = NULL, free_quota = CASE WHEN verified_at IS NULL THEN COALESCE(free_quota, 0) + 1 ELSE free_quota END WHERE id = $2`, [sessionToken, user.id]);
      const grantedFreeQuota = firstVerification ? (user.free_quota ?? 0) + 1 : (user.free_quota ?? 0);
      return res.json({ userId: user.id, sessionToken, freeQuota: grantedFreeQuota });
    } catch (error: any) {
      console.error("/api/register/verify-code error", error);
      return res.status(500).json({ error: error.message || "验证码校验失败，请稍后重试。" });
    }
  });

  // 登录
  app.post("/api/login", async (req, res) => {
    try {
      const phone = (req.body.phone || "").toString().trim();
      const password = (req.body.password || "").toString().trim();
      if (!phone || !password) return res.status(400).json({ error: "手机号和密码均为必填。" });
      if (password.length < 6) return res.status(400).json({ error: "密码最低6位。" });

      const user = await getUserByPhone(phone);
      if (!user || !user.verified_at) return res.status(404).json({ error: "用户不存在或未完成注册，请先注册。" });
      if (!user.password_hash || !verifyPassword(password, user.password_hash)) return res.status(400).json({ error: "手机号或密码错误。" });

      const sessionToken = createSessionToken();
      await query(`UPDATE users SET session_token = $1 WHERE id = $2`, [sessionToken, user.id]);
      return res.json({ userId: user.id, sessionToken, freeQuota: user.free_quota ?? 0 });
    } catch (error: any) {
      console.error("/api/login error", error);
      return res.status(500).json({ error: error.message || "登录失败，请稍后重试。" });
    }
  });
}
