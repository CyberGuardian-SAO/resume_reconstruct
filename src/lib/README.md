# 用户认证 & 微信支付模块 — 集成指南

将 `src/lib/` 下的三个模块复制到你的项目，即可快速集成**手机号+短信验证码注册/登录**和**微信 Native Pay 支付**功能。

---

## 目录结构

```
src/lib/
├── db.ts          # 数据库连接池、表结构、通用工具函数
├── auth.ts        # 用户认证：注册、登录、短信、会话中间件
├── payment.ts     # 微信支付：下单、查询、回调、轮询、额度消耗
└── README.md      # 本文件
```

---

## 快速集成

### 1. 复制文件

将 `src/lib/` 整个目录复制到你的项目。

### 2. 安装依赖

```bash
npm install express pg axios @google/genai dotenv
npm install --save-dev @types/express @types/node @types/pg
```

### 3. 配置环境变量

在 `.env` 中设置（根据你集成的模块按需添加）：

```env
# ========== 数据库（必填） ==========
DATABASE_URL=postgresql://user:password@host:5432/database
# 或用以下独立变量：
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=resume_app

# ========== 阿里云短信（选填，不使用可删除 sendAliyunSms 调用） ==========
ALIYUN_SMS_ACCESS_KEY_ID=your_key_id
ALIYUN_SMS_ACCESS_KEY_SECRET=your_key_secret
ALIYUN_SMS_SIGN_NAME=你的签名
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxx

# ========== 微信支付（选填） ==========
MCHID=你的商户号
APPID=你的AppId
APIV3_KEY=你的APIv3密钥
CERT_SERIAL_NO=证书序列号
WECHAT_PRIVATE_KEY_PATH=./apiclient_key.pem
WX_NOTIFY_URL=https://your-domain.com/api/payment/wechat/notify
```

### 4. 注册路由

```typescript
import express from "express";
import { registerAuthRoutes } from "./src/lib/auth";
import { registerPaymentRoutes } from "./src/lib/payment";

const app = express();
app.use(express.json());

// 注册用户模块路由（/api/register/*, /api/login）
registerAuthRoutes(app);

// 注册支付模块路由（/api/payment/*, /api/usage/status）
registerPaymentRoutes(app);
```

### 5. 初始化数据库（启动时调用一次）

```typescript
import { initDatabase } from "./src/lib/db";

async function start() {
  await initDatabase();  // 自动创建 users、payments、usage_logs 表
  app.listen(3000);
}
start();
```

---

## 模块说明

### `db.ts` — 数据库 & 工具

| 导出 | 说明 |
|------|------|
| `pool` | PostgreSQL 连接池实例 |
| `query(text, params?)` | 执行 SQL 查询 |
| `initDatabase()` | 创建三张业务表（幂等） |
| `DATABASE_URL` | 数据库连接字符串 |
| `getUserByToken(token)` | 按 session_token 查用户 |
| `getUserByPhone(phone)` | 按手机号查用户 |
| `createSessionToken()` | 生成 48 位随机会话令牌 |
| `randomHex(len)` | 生成指定长度的随机十六进制串 |
| `hashPassword(password)` | 使用 scrypt + 随机盐加密密码，返回 `salt:hash` |
| `verifyPassword(password, stored)` | 验证密码（常量时间比较） |
| `cleanJsonString(raw)` | 清理 AI 输出中可能的 markdown 包裹 |
| `percentEncode(str)` / `formatTimestamp(date)` / `assertEnv(var, name)` | 阿里云签名 / 时间格式化 / 环境变量断言 |

### `auth.ts` — 用户认证

| 导出 | 说明 |
|------|------|
| `registerAuthRoutes(app)` | 注册以下三个路由 |
| `authenticateSession(req, res, next)` | 中间件 — 要求有效 sessionToken，否则 401 |
| `authenticateSessionOrCreate(req, res, next)` | 中间件 — 有 token 则验证，无 token 或 token 无效则自动创建新匿名用户 |

**路由列表：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register/send-code` | 发送短信验证码，创建用户记录 |
| POST | `/api/register/verify-code` | 校验验证码 + 密码，完成注册 |
| POST | `/api/login` | 手机号 + 密码登录 |

**前端调用示例：**

```typescript
// 1. 发送验证码
await fetch("/api/register/send-code", {
  method: "POST",
  body: JSON.stringify({ phone: "138xxxx", password: "123456", passwordConfirm: "123456" }),
});

// 2. 校验验证码
const res = await fetch("/api/register/verify-code", {
  method: "POST",
  body: JSON.stringify({ phone: "138xxxx", code: "123456", password: "123456" }),
});
const { sessionToken, freeQuota } = await res.json();
localStorage.setItem("sessionToken", sessionToken);

// 3. 后续请求携带 token
fetch("/api/transition", {
  headers: { Authorization: `Bearer ${sessionToken}` },
  // ...
});
```

### `payment.ts` — 微信支付

| 导出 | 说明 |
|------|------|
| `registerPaymentRoutes(app)` | 注册以下四条路由 |
| `consumeUserQuota(userId, paymentId?)` | 消耗用户额度（免费或已支付订单） |

**路由列表：**

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/usage/status` | `authenticateSession` | 查询用户剩余免费额度和未使用的已支付额度 |
| POST | `/api/payment/create` | `authenticateSession` | 创建微信 Native Pay 订单，返回 `codeUrl` |
| POST | `/api/payment/status` | `authenticateSession` | 查询订单状态（本地 + 自动向微信核实） |
| POST | `/api/payment/wechat/notify` | 无 | 微信支付结果回调通知 |

**额度消耗逻辑（consumeUserQuota）：**

1. 传入 `paymentId` → 按支付订单消耗（标记 `used=true`）
2. 不传 `paymentId` → 按 `free_quota` 消耗（减 1）

---

## 数据库表结构

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
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
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    amount INT NOT NULL,
    status TEXT NOT NULL,         -- PENDING / PAID / REFUND
    order_no TEXT UNIQUE NOT NULL,
    trade_no TEXT UNIQUE,
    code_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ,
    used BOOLEAN NOT NULL DEFAULT false
);

-- 使用记录表
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,           -- free / paid
    source TEXT NOT NULL,         -- transition / payment / wechat-poll / wechat-manual-check
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 前端 API 对接示例

```typescript
// 查询额度
const status = await fetch("/api/usage/status", {
  headers: { Authorization: `Bearer ${token}` },
});
const { freeQuota, availablePaidQuota } = await status.json();

// 创建支付
const pay = await fetch("/api/payment/create", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ amountCents: 100, description: "付费使用一次服务" }),
});
const { paymentId, codeUrl } = await pay.json();

// 查询支付状态
const status = await fetch("/api/payment/status", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ paymentId }),
});
const { status: orderStatus } = await status.json();
```

---

## 自定义扩展

- **替换短信服务**：修改 `auth.ts` 中的 `sendAliyunSms` 函数，或替换为其他短信 SDK
- **更换支付渠道**：修改 `payment.ts` 中的 `createWechatNativeOrder`，替换为支付宝等 API
- **额度策略**：调整 `consumeUserQuota` 中的 `free_quota` 扣减逻辑
- **数据库**：编辑 `db.ts` 中 `initDatabase` 的表定义，或替换为其他 ORM
