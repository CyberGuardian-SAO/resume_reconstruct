/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 微信支付模块
 * 提供微信 Native Pay 下单、查询、回调、轮询、额度消耗等
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import axios from "axios";
import { query, randomHex, assertEnv } from "./db";
import { authenticateSession } from "./auth";

// ─── 环境变量 ─────────────────────────────────────────────────

const WECHAT_MCHID = process.env.MCHID;
const WECHAT_APPID = process.env.APPID;
const WECHAT_APIV3_KEY = process.env.APIV3_KEY;
const WECHAT_CERT_SERIAL_NO = process.env.CERT_SERIAL_NO;

function getWechatNotifyUrl() {
  if (process.env.WX_NOTIFY_URL) return process.env.WX_NOTIFY_URL;
  if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) {
    return `${process.env.APP_URL.replace(/\/+$/g, "")}/api/payment/wechat/notify`;
  }
  return "http://localhost:3000/api/payment/wechat/notify";
}

const WECHAT_NOTIFY_URL = getWechatNotifyUrl();
const WECHAT_PRIVATE_KEY_PATH = process.env.WECHAT_PRIVATE_KEY_PATH || path.join(process.cwd(), "apiclient_key.pem");
const WECHAT_CERT_PATH = process.env.WECHAT_CERT_PATH || path.join(process.cwd(), "apiclient_cert.pem");

// ─── 工具 ────────────────────────────────────────────────────

function generateWechatOrderNo() {
  return `wx${Date.now()}${crypto.randomBytes(6).toString("hex")}`.slice(0, 32);
}

function createUsageLog(userId: string, type: string, source: string, details: any = {}) {
  return query(`INSERT INTO usage_logs (user_id, type, source, details) VALUES ($1, $2, $3, $4)`, [
    userId, type, source, details,
  ]);
}

// ─── 微信 API 交互 ───────────────────────────────────────────

async function createWechatNativeOrder(orderNo: string, amount: number, description: string) {
  assertEnv(WECHAT_MCHID, "MCHID");
  assertEnv(WECHAT_APPID, "APPID");
  assertEnv(WECHAT_APIV3_KEY, "APIV3_KEY");
  assertEnv(WECHAT_CERT_SERIAL_NO, "CERT_SERIAL_NO");

  const body = {
    appid: WECHAT_APPID,
    mchid: WECHAT_MCHID,
    description,
    out_trade_no: orderNo,
    notify_url: WECHAT_NOTIFY_URL,
    amount: { total: amount, currency: "CNY" },
    scene_info: { payer_client_ip: "127.0.0.1" },
  };

  const payload = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = randomHex(16);
  const message = ["POST", "/v3/pay/transactions/native", timestamp, nonceStr, payload, ""].join("\n");
  const privateKey = fs.readFileSync(WECHAT_PRIVATE_KEY_PATH, "utf8");
  const signature = crypto.createSign("RSA-SHA256").update(message).sign(privateKey, "base64");
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${WECHAT_CERT_SERIAL_NO}",appid="${WECHAT_APPID}"`;

  const response = await axios.post("https://api.mch.weixin.qq.com/v3/pay/transactions/native", payload, {
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.data?.code_url) {
    throw new Error(`微信Native Pay创建订单失败: ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

async function queryWechatOrder(orderNo: string) {
  assertEnv(WECHAT_MCHID, "MCHID");
  assertEnv(WECHAT_APPID, "APPID");
  assertEnv(WECHAT_PRIVATE_KEY_PATH, "WECHAT_PRIVATE_KEY_PATH");

  const pathUrl = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${WECHAT_MCHID}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = randomHex(16);
  const message = ["GET", pathUrl, timestamp, nonceStr, "", ""].join("\n");
  const privateKey = fs.readFileSync(WECHAT_PRIVATE_KEY_PATH, "utf8");
  const signature = crypto.createSign("RSA-SHA256").update(message).sign(privateKey, "base64");
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_MCHID}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${WECHAT_CERT_SERIAL_NO}",appid="${WECHAT_APPID}"`;

  const response = await axios.get(`https://api.mch.weixin.qq.com${pathUrl}`, {
    headers: { Authorization: authorization, Accept: "application/json" },
  });
  return response.data;
}

function startPaymentPolling(orderNo: string, userId: string, maxAttempts = 12, intervalMs = 5000) {
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    try {
      const data = await queryWechatOrder(orderNo);
      const tradeState = (data as any).trade_state || (data as any).status || null;
      const transactionId = (data as any).transaction_id || (data as any).trade_state || null;
      if ((data as any).transaction_id || tradeState === 'SUCCESS') {
        await query(`UPDATE payments SET status = 'PAID', trade_no = $1, paid_at = now() WHERE order_no = $2`, [(data as any).transaction_id || transactionId, orderNo]);
        await createUsageLog(userId, "paid", "wechat-poll", { orderNo, wechat: data });
        clearInterval(timer);
        return;
      }
    } catch (err) {
      console.error(`Polling wechat order ${orderNo} attempt ${attempts} failed:`, (err as any)?.message || err);
    }
    if (attempts >= maxAttempts) {
      clearInterval(timer);
    }
  }, intervalMs);
}

function decryptWechatNotifyResource(resource: any) {
  assertEnv(WECHAT_APIV3_KEY, "APIV3_KEY");
  const associatedData = resource.associated_data || "";
  const nonce = resource.nonce;
  const ciphertext = resource.ciphertext;
  const buffer = Buffer.from(ciphertext, "base64");
  const authTag = buffer.slice(buffer.length - 16);
  const data = buffer.slice(0, buffer.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(WECHAT_APIV3_KEY!, "utf8"), Buffer.from(nonce, "utf8"));
  if (associatedData) decipher.setAAD(Buffer.from(associatedData, "utf8"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(decrypted);
}

// ─── 额度消耗 ────────────────────────────────────────────────

export async function consumeUserQuota(userId: string, paymentId?: string) {
  if (paymentId) {
    const result = await query(`SELECT * FROM payments WHERE order_no = $1 AND user_id = $2`, [paymentId, userId]);
    const payment = result.rows[0];
    if (!payment || payment.status !== "PAID" || payment.used) {
      throw new Error("支付订单无效或未完成付款。");
    }
    await query(`UPDATE payments SET used = true WHERE order_no = $1`, [paymentId]);
    await createUsageLog(userId, "paid", "payment", { paymentId });
    return { type: "paid" as const, paymentId };
  }

  const result = await query(`SELECT free_quota FROM users WHERE id = $1`, [userId]);
  const user = result.rows[0];
  if (!user || user.free_quota <= 0) {
    throw new Error("当前免费额度已用完，请先支付。原始订单可通过 /api/payment/create 生成。");
  }
  await query(`UPDATE users SET free_quota = free_quota - 1 WHERE id = $1`, [userId]);
  await createUsageLog(userId, "free", "transition", {});
  return { type: "free" as const };
}

// ─── 路由注册 ─────────────────────────────────────────────────

export function registerPaymentRoutes(app: express.Application) {
  // 查询用户额度
  app.get("/api/usage/status", authenticateSession, async (req, res) => {
    try {
      const user = (req as any).user;
      const paidResult = await query(`SELECT COUNT(*) AS count FROM payments WHERE user_id = $1 AND status = 'PAID' AND used = false`, [user.id]);
      return res.json({ freeQuota: user.free_quota, availablePaidQuota: Number(paidResult.rows[0]?.count || 0) });
    } catch (error: any) {
      console.error("/api/usage/status error", error);
      return res.status(500).json({ error: error.message || "查询额度失败。" });
    }
  });

  // 创建支付订单
  app.post("/api/payment/create", authenticateSession, async (req, res) => {
    try {
      const user = (req as any).user;
      const amount = Number(req.body.amountCents || 100);
      const description = (req.body.description || "付费使用一次简历重构服务").toString();
      if (amount <= 0) return res.status(400).json({ error: "支付金额必须大于0。" });

      const orderNo = generateWechatOrderNo();
      const wechatResult = await createWechatNativeOrder(orderNo, amount, description);

      await query(`INSERT INTO payments (user_id, amount, status, order_no, code_url, description) VALUES ($1, $2, $3, $4, $5, $6)`, [
        user.id, amount, "PENDING", orderNo, wechatResult.code_url, description,
      ]);

      try { startPaymentPolling(orderNo, user.id, 24, 5000); } catch (err) {
        console.error("Failed to start payment polling:", err);
      }

      return res.json({ paymentId: orderNo, codeUrl: wechatResult.code_url, amount, description });
    } catch (error: any) {
      console.error("/api/payment/create error", error);
      return res.status(500).json({ error: error.message || "创建微信支付订单失败。" });
    }
  });

  // 查询支付状态
  app.post("/api/payment/status", authenticateSession, async (req, res) => {
    try {
      const user = (req as any).user;
      const paymentId = (req.body.paymentId || "").toString();
      if (!paymentId) return res.status(400).json({ error: "paymentId 为必填。" });

      const result = await query(`SELECT * FROM payments WHERE order_no = $1 AND user_id = $2`, [paymentId, user.id]);
      const payment = result.rows[0];
      if (!payment) return res.status(404).json({ error: "未找到对应支付订单。" });

      // 本地待支付时向微信查询真实状态
      if (payment.status === "PENDING") {
        try {
          const wechatData = await queryWechatOrder(paymentId);
          const tradeState = (wechatData as any).trade_state || (wechatData as any).status || null;
          if (tradeState === 'SUCCESS' || (wechatData as any).transaction_id) {
            const transactionId = (wechatData as any).transaction_id || (wechatData as any).trade_state || null;
            await query(`UPDATE payments SET status = 'PAID', trade_no = $1, paid_at = now() WHERE order_no = $2`, [transactionId, paymentId]);
            await createUsageLog(user.id, "paid", "wechat-manual-check", { orderNo: paymentId, wechat: wechatData });
            return res.json({ status: "PAID", used: false, amount: payment.amount });
          }
        } catch (wechatErr) {
          console.error("WeChat direct query failed, falling back to DB status:", (wechatErr as any)?.message || wechatErr);
        }
      }

      return res.json({ status: payment.status, used: payment.used, amount: payment.amount });
    } catch (error: any) {
      console.error("/api/payment/status error", error);
      return res.status(500).json({ error: error.message || "查询支付状态失败。" });
    }
  });

  // 微信支付回调通知
  app.post("/api/payment/wechat/notify", async (req, res) => {
    try {
      const event = req.body;
      if (!event?.resource) return res.status(400).json({ code: "FAIL", message: "微信回调缺少 resource 字段" });

      const decrypted = decryptWechatNotifyResource(event.resource);
      if (decrypted?.out_trade_no) {
        await query(`UPDATE payments SET status = 'PAID', trade_no = $1, paid_at = now() WHERE order_no = $2`, [decrypted.transaction_id || decrypted.trade_no, decrypted.out_trade_no]);
        return res.json({ code: "SUCCESS", message: "成功" });
      }
      return res.status(400).json({ code: "FAIL", message: "微信回调解析失败" });
    } catch (error: any) {
      console.error("/api/payment/wechat/notify error", error);
      return res.status(500).json({ code: "FAIL", message: error.message || "微信回调处理失败。" });
    }
  });
}
