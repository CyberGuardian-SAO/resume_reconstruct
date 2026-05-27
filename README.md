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
