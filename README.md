# 跨行求职策略与简历重构系统 - 模型接入指引教程

本应用默认集成享誉全球且性能卓越的 **Google Gemini 3.5 Flash** 智能模型，实现了极速的跨行简历迁移、话术分析以及7天军备计划输出。

为了满足部分用户希望接入其他 AI 模型（如 **OpenAI GPT-4o**、**DeepSeek-V3/R1**、**阿里通义千问**、**月之暗面 Kimi** 等）的业务需求，系统特别设计了 **OpenAI 兼容型通用网关极简接入方案**。

您无需修改任何核心编译代码，仅需在环境变量中进行对应配置，即可一键将底层的简历重构引擎切换为任意其他的第三方大语言模型！

---

## 🛠️ 配置环境变量（在 Secrets 中设定）

在 AI Studio 工作台中，您可以点击右上角的 **Settings (设置) -> Secrets (密钥管理)** 面板配置以下各项变量，或者在本地独立运行开发时在根目录创建并写入 `.env` 文件。

| 环境变量名称 | 是否必填 | 默认值 | 示例及说明 |
| :--- | :---: | :--- | :--- |
| `AI_PROVIDER` | 否 | `gemini` | 设置为 **`openai`** 将正式启用兼容其他厂商模型的逻辑；不设置则默认保留自带的官方 Gemini 引擎。 |
| `OPENAI_API_KEY` | 是 (当使用openai时) | 无 | 第三方兼容模型平台的 API Key。 |
| `OPENAI_API_BASE` | 否 | `https://api.openai.com/v1` | 兼容接口的数据接收基础网关前缀。（例如 DeepSeek 可配置为 `https://api.deepseek.com/v1` 等） |
| `OPENAI_MODEL` | 否 | `gpt-4o` | 所选大模型的实体识别名称代码（例如 `deepseek-chat` / `gpt-4o` / `qwen-plus`）。 |
| `DATABASE_URL` | 是 | 无 | PostgreSQL 数据库连接字符串，格式: `postgresql://username:password@host:port/database` |
| `ALIYUN_ACCESS_KEY_ID` | 否 | 无 | 阿里云短信服务的 Access Key ID |
| `ALIYUN_ACCESS_KEY_SECRET` | 否 | 无 | 阿里云短信服务的 Access Key Secret |
| `ALIYUN_SMS_SIGN` | 否 | 无 | 短信签名名称 |
| `ALIYUN_SMS_TEMPLATE` | 否 | 无 | 短信模板代码 |

---

## 🗄️ PostgreSQL 数据库配置与验证

### 1. PostgreSQL 安装与启动

**Windows 平台：**
```bash
# 使用 Chocolatey 安装
choco install postgresql

# 或者直接从官方网站下载安装程序
# https://www.postgresql.org/download/windows/

# 启动 PostgreSQL 服务
net start postgresql-x64-15  # 版本号可能不同

# 或通过 Services 手动启动
```

**macOS 平台：**
```bash
# 使用 Homebrew 安装
brew install postgresql
brew services start postgresql

# 或直接使用 postgres.app
# https://postgresapp.com/
```

**Linux 平台 (Ubuntu/Debian)：**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo service postgresql start

# 或
sudo systemctl start postgresql
```

### 2. 创建数据库与用户

```bash
# 使用 psql 连接到 PostgreSQL
psql -U postgres

# 或指定主机
psql -h localhost -U postgres
```

在 psql 命令行中执行：

```sql
-- 创建数据库
CREATE DATABASE resume_app;

-- 创建用户（可选，如果使用 postgres 用户可跳过）
CREATE USER resume_user WITH PASSWORD 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE resume_app TO resume_user;

-- 连接到新数据库
\c resume_app

-- 创建必要的表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    session_token TEXT UNIQUE,
    password_hash TEXT,
    free_quota INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    sms_code TEXT,
    sms_code_expires TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS payments (
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
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_no);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
```

### 3. 验证 PostgreSQL 是否正常运行

**检查 PostgreSQL 服务状态：**

```bash
# Windows - 检查服务
Get-Service postgresql-x64-15  # PowerShell

# macOS/Linux - 检查服务
sudo systemctl status postgresql

# 或检查监听端口
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows
```

**验证数据库连接：**

```bash
# 使用 psql 测试连接
psql -h localhost -U resume_user -d resume_app

# 或指定其他主机/端口
psql -h 192.168.1.100 -p 5432 -U resume_user -d resume_app

# 连接成功后会进入 psql 交互模式，输入 \quit 退出
```

**验证表结构和数据：**

```sql
-- 列出所有表
\dt

-- 检查表结构
\d users
\d payments
\d usage_logs

-- 查看表中的数据
SELECT * FROM users;
SELECT * FROM payments;
SELECT * FROM usage_logs;

-- 检查索引
\di

-- 查看数据库大小
SELECT pg_size_pretty(pg_database_size('resume_app'));
```

**在应用启动时验证数据库：**

本应用后端在启动时会自动检查数据库连接。如果 `.env` 中配置的 `DATABASE_URL` 正确，应用会：
1. 自动连接到 PostgreSQL 数据库
2. 第一次 API 请求时自动创建用户表和会话
3. 之后的所有操作都会持久化到数据库

如果出现连接错误，请检查：
- PostgreSQL 服务是否启动
- `DATABASE_URL` 连接字符串是否正确（用户名、密码、主机、端口、数据库名）
- 防火墙是否允许 PostgreSQL 端口（默认 5432）的连接

---

## 💡 各大主流 AI 大模型一键接入示范

下面为您整理出几大业界常用的主流模型代理平台的极速配置示例。

### 1. 极速切换至 DeepSeek (深度求索)
* **`AI_PROVIDER`**: `openai`
* **`OPENAI_API_KEY`**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxx` (您的 DeepSeek 平台 Key)
* **`OPENAI_API_BASE`**: `https://api.deepseek.com/v1`
* **`OPENAI_MODEL`**: `deepseek-chat`

### 2. 极速切换至 OpenAI 官方平台 (如 GPT-4o)
* **`AI_PROVIDER`**: `openai`
* **`OPENAI_API_KEY`**: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx`
* **`OPENAI_API_BASE`**: `https://api.openai.com/v1`
* **`OPENAI_MODEL`**: `gpt-4o`

### 3. 极速切换至阿里云通义大模型 (千问)
* **`AI_PROVIDER`**: `openai`
* **`OPENAI_API_KEY`**: `sk-xxxxxxxxxxx`
* **`OPENAI_API_BASE`**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
* **`OPENAI_MODEL`**: `qwen-plus` (或 `qwen-max`)

### 4. 极速切换至 Kimi (月之暗面)
* **`AI_PROVIDER`**: `openai`
* **`OPENAI_API_KEY`**: `sk-xxxxxxxxxxx`
* **`OPENAI_API_BASE`**: `https://api.moonshot.cn/v1`
* **`OPENAI_MODEL`**: `moonshot-v1-8k`

---

## 🔍 原理解析与接口协议

系统底层为了支持各种模型的健壮接入，设计了严格的防崩溃容错：
1. **JSON 结构约束**：
   后端向兼容提供商传递了严格的 JSON Schema 指示符，确保任何第三方的模型也能输出和 React 精准对标、完全一致的 3 段式企划案：
   * `inquiryScripts`：包含稳重型、主动进攻型、轻沟通型 3 种话术。
   * `prepStrategy`：包含能力缺口、7天行军备考计划配额以及证明材料大纲模板。
   * `resumeDetails`：重组的姓名、联系方式、合理自述、可迁移核心能力、工作经历 STAR 描述以及仿真作品项目。
2. **防 Markdown 侵入**：
   在 Request system prompt 结尾强制增加了 JSON 返回声明指令，能自动识别并过滤部分兼容平台附带的 ` ```json ... ``` ` 代码块，防止 JSON 解析报错。
3. **安全自恢复机制**：
   由于前端对简历渲染已实现了 **WYSIWYG (所见即所得) 极简全字段在线修改**，即使由于网络波动或部分小模型的返回值产生了字段轻微缺失，您也可以在前端渲染页面直接输入内容添加、删改，确保导出 PDF 体验流畅。
