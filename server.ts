/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 主服务器入口 - 组装各模块路由、AI 端点、Vite 中间件
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

import { initDatabase, cleanJsonString, query } from "./src/lib/db";
import { registerAuthRoutes, authenticateSessionOrCreate } from "./src/lib/auth";
import { registerPaymentRoutes, consumeUserQuota } from "./src/lib/payment";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const PORT = 3000;

// ─── AI 客户端 ───────────────────────────────────────────────

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined in the environment.");
    aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
  }
  return aiClient;
}

// ─── Gemini 输出 Schema ──────────────────────────────────────

const transitionResultSchema = {
  type: Type.OBJECT,
  properties: {
    inquiryScripts: {
      type: Type.OBJECT,
      properties: {
        steady: { type: Type.STRING, description: "稳重型投递话术 (80-120字)，适合传统、严谨行业。强合理化跨行合理性，强调底层稳定的抗压及踏实执行力，语气专业周密。绝对不包含任何 brackets 占位符。" },
        active: { type: Type.STRING, description: "主动进攻型投递话术 (80-120字)，适合互联网、服务业、销售。成交导向，强调对该品牌的精细调研，带出过往高业务增长或执行细节，显露自信进取的气质。绝对不包含任何 brackets 占位符。" },
        casual: { type: Type.STRING, description: "轻沟通型投递话术 (80-120字)，适合门店、初级基础岗位。快捷高效，直接点明最贴切目标岗位最强悍的一个技能，以'顺带问一句'的语气，完成自我成交。绝对不包含任何 brackets 占位符。" },
      },
      required: ["steady", "active", "casual"],
    },
    prepStrategy: {
      type: Type.OBJECT,
      properties: {
        skillsGap: { type: Type.ARRAY, items: { type: Type.STRING }, description: "直接点明候选人在匹配该JD时的核心能力缺口 (2-4条)，无需委婉客气，正中招聘单位痛点。字词需专业。" },
        sevenDayPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER, description: "天数 (1到7)" },
              focus: { type: Type.STRING, description: "今日学习/训练主线" },
              learn: { type: Type.STRING, description: "硬核知识注入 (如行业行话、关键指标公式、工具使用等)" },
              practice: { type: Type.STRING, description: "模拟实战演练 (如模拟排班、推算转化率、客诉实战复盘等)" },
              output: { type: Type.STRING, description: "今日有形资产产出 (如一套预备的门店排班excel草稿、一个活动构想短案、一个基础服务SOP表格等)" },
            },
            required: ["day", "focus", "learn", "practice", "output"],
          },
        },
        portfolioMaterials: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "证明材料名称 (如: 一个下午绘制的《门店日常开关店及服务标准SOP流程手册》/ 一张《某区域奶茶店竞品周活动拆解及改进构想》)" },
              description: { type: Type.STRING, description: "痛点对焦 (说明这份证明材料，正好应对了招聘方看你转行时的哪一项最敏感的风险疑惑)" },
              value: { type: Type.STRING, description: "隐藏能力证明 (表面看是一份方案，实则无声展示了你具备过硬的什么专业基本功)" },
              templateExample: { type: Type.STRING, description: "一个具体而微的大纲或样本示范。不要只给概念描述，要写出实际可用的大概结构、指标设定，让人能直接顺着写。绝对不包含任何 brackets 占位符。" },
            },
            required: ["type", "description", "value", "templateExample"],
          },
        },
      },
      required: ["skillsGap", "sevenDayPlan", "portfolioMaterials"],
    },
    resumeDetails: {
      type: Type.OBJECT,
      properties: {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "候选人姓名，如果没有，默认为 示例候选人" },
            jobTitle: { type: Type.STRING, description: "求职目标岗位名称（强匹配JD）" },
            phone: { type: Type.STRING, description: "电话，默认为 13800000000" },
            wechat: { type: Type.STRING, description: "微信，默认为 13800000000" },
            email: { type: Type.STRING, description: "邮箱，默认为 resume_example@example.com" },
            location: { type: Type.STRING, description: "意向工作地（城市）" },
            customPdfName: { type: Type.STRING, description: "PDF下载文件的自定义保存名，格式必须严格遵循: 岗位名称_示例候选人_13800000000（微信同号）" },
          },
          required: ["name", "jobTitle", "phone", "wechat", "email", "location", "customPdfName"],
        },
        intro: { type: Type.STRING, description: "精短极具说服力的个人转型自述。合理解释为何选择此行业以及自己的过往技能由于何种底层共通性可以完美接轨（合理化转型、一句话消解招聘官的担忧风险）" },
        coreSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "迁移能力词 (如：敏锐客诉防范与快速挽回、高压团队排班与动态人力微调、数字化库存精细运营等)" },
              description: { type: Type.STRING, description: "结合过往成熟案例，用数字简述技能成熟度，说明对新职位的即刻可用性。" },
            },
            required: ["name", "description"],
          },
        },
        workExperiences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING, description: "过往公司名称" },
              role: { type: Type.STRING, description: "担任的角色/目标强匹配化称谓" },
              duration: { type: Type.STRING, description: "起止时间(如: 2021.03 - 2024.01)" },
              highlight: { type: Type.STRING, description: "转型亮点总结，简要指出在该岗位积累了哪些可完美应用在目标岗位的底层相通本领 (40-70字)" },
              achievements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "该岗位核心重大成果的真实匹配化包装说明(每段过往履历提炼 2-4 条)，必须严格遵循 '用 行为+客观指标结果 / STAR' 方案描述实干细节，不可平铺直叙。" },
            },
            required: ["company", "role", "duration", "highlight", "achievements"],
          },
        },
        portfolioProject: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "模拟方案/攻坚项目的名称 (如: 《蜜雪冰城客单提振及快消品排队消散2周战役》)" },
            role: { type: Type.STRING, description: "你在该高精拟真项目中所担当的角色 (体现执行专业度)" },
            description: { type: Type.STRING, description: "对该案例的核心痛点场景和解决主导思路进行描述说明 (80-130字)" },
            outputs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "该项目输出的高精仿真交付作品文件包或操作清单 (3-5份)，说明你对新行的工作流细节已经滚瓜烂熟。" },
          },
          required: ["name", "role", "description", "outputs"],
        },
        educationList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              school: { type: Type.STRING, description: "毕业院校名称，禁止使用占位符 (如：南京工商大学、示范理工学院)" },
              major: { type: Type.STRING, description: "主修专业，禁止使用占位符 (如：工商管理、计算机科学与技术)" },
              degree: { type: Type.STRING, description: "学位/学历学位级别 (如：本科、硕士、大专)" },
              duration: { type: Type.STRING, description: "起止时间 (如：2016.09 - 2020.06)" },
            },
            required: ["school", "major", "degree", "duration"],
          },
        },
      },
      required: ["personalInfo", "intro", "coreSkills", "workExperiences", "portfolioProject", "educationList"],
    },
  },
  required: ["inquiryScripts", "prepStrategy", "resumeDetails"],
};

// ─── Express 应用 ────────────────────────────────────────────

const app = express();
app.use(express.json());

registerAuthRoutes(app);
registerPaymentRoutes(app);

// ─── AI 简历重构端点 ─────────────────────────────────────────

app.post("/api/transition", authenticateSessionOrCreate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { targetJobName, jobDescription, candidateBackground, candidateName, candidatePhone, paymentId } = req.body;

    if (!targetJobName || !jobDescription || !candidateBackground) {
      return res.status(400).json({ error: "岗位名称、岗位描述 (JD) 和 候选人情况 均为必填项。" });
    }

    let usageType: "free" | "paid" = "free";
    let paymentIdToUse: string | undefined;
    try {
      const quotaResult = await query(`SELECT free_quota FROM users WHERE id = $1`, [user.id]);
      const freeQuota = quotaResult.rows[0]?.free_quota ?? 0;
      if (freeQuota > 0) {
        usageType = "free";
      } else if (paymentId) {
        paymentIdToUse = paymentId;
        usageType = "paid";
      } else {
        const paidResult = await query(`SELECT order_no FROM payments WHERE user_id = $1 AND status = 'PAID' AND used = false ORDER BY created_at ASC LIMIT 1`, [user.id]);
        const autoPaymentId = paidResult.rows[0]?.order_no;
        if (autoPaymentId) { paymentIdToUse = autoPaymentId; usageType = "paid"; }
        else { return res.status(402).json({ error: "当前免费额度已用完，请先支付。", paymentRequired: true }); }
      }
    } catch (quotaError: any) {
      return res.status(402).json({ error: quotaError.message || "当前免费额度已用完，请先支付。", paymentRequired: true });
    }

    const systemInstruction = `你是一位享誉全球的跨行业求职策略专家、顶尖招聘经理（招聘方思维模拟器）以及简历重构大师。

今天，你需要帮助一位跨行转型的候选人，将其经历包装重构成最抓主考官眼球、天然降低招聘方"跨行高风险、上手慢、不持久、不稳定"疑虑的硬核候选人。

请你充分分析目标候选人的情况（技能/经验/跨行原因）和目标岗位的职责/JD。随后，利用招聘圈资深眼光，输出匹配度最高、字字珠玑、毫无水分的专业解答。

🚨 【极其重要】：所有输出的文本中，严禁包含类似以下括号格式 of placeholders:
- "[具体时间]" / "[具体数据]" / "[公司名称]" / "[岗位名称]"等
- "xx公司" / "xx项目" / "xx年xx月"等模糊占位符。
All数据和名称必须是依据候选人的原始输入、结合对应行业常识，生成的高度逼真、丰满、合理的"拟真数据（如 客服组长管理24人团队、促使顾客投诉流失降低34%、提升日常排程周转率等）"和具体的细节。

【1. 求职话术策略】
- 提供包含3个风格的高情商话术 (各自控制在 80-120 字)：
  1. 稳重型（沉稳踏实，适合传统偏严谨行业，展现耐劳力与高度自驱及成长周期）
  2. 主动进攻型（求战心切，适合销售营运或轻资产服务业，主动展露对该品牌的深度分析，自我成交）
  3. 轻沟通型（门店、轻资产零售或基础性岗位，亲和爽快，顺带抛出自己能立即上岗或最顺手的干货技能）
- 严禁任何乞求感或自惭形秽。语气不卑不亢，让招人方感受到极高的职场情商和直接可用性。

【2. 7天速成方案 & 证明材料】
- 招聘官最在乎的事情是什么？从跨行视角明确指出其"核心能力缺口"（2-4条）。字词必须刺中要害（不要客气）。
- 设计极具实操性、精确到每一天的「7天超强度行军备战方案」。包含学什么、练什么、输出什么。
- 设定不可拒绝的「仿真证明材料 / 个人作品」。例如如果是餐饮门店岗位，模拟一份排餐考核、一个客诉处理金句包；如果是运营，给出一个引流方案草案等。并在 answers 里提供非常详细、有条理的可落地参考样例大纲。

【3. 定制简历重构】
- 重新编辑候选人原本跟目标JD毫无关联或是偏向旧行业的经历细节。
- 将经历里的核心职责转化为目标岗位亟需的「可迁移能力」（例如：将"客服接待"重构为"高负荷客诉妥善回转、标准化服务流程管理与人力负荷调配"）。
- 用场景化与定量的数据指标来强化每个点，充分贯彻「行为 + 结果」或「STAR」原则描述。
- 个人简介部分必须具备高度的战略合理化，一语击碎对方跨界风险的刻板印象。
- 提供专门针对此岗位设计、包装的一个「模拟/仿真项目或作业案例」，里面包含清晰的产出物名字，极其逼真。

🚨【输出最高指示 - OUTPUT FORMAT CONSTRAINT】：
1. 你必须、只能、且完全返回符合预设 JSON 模式的单个 valid JSON 对象结构，不要添加任何额外的根级属性。
2. 绝对不能使用任何 markdown 格式（如 \`\`\`json 或 \`\`\`）形式包裹，绝不带有任何多余的根级属性。`;

    const userPrompt = `【求职目标岗位名称】：
${targetJobName}

【目标岗位职责及JD要求】：
${jobDescription}

【候选人当前情况（背景/原行业技能/跨行转型原因）】：
${candidateBackground}

请针对以上输入，生成包含求职问询话术、备战计划配置和重构简历的完整转型企划案 JSON。请确保所有字段的数据高度详实逼真，严禁使用 placeholder 类型的占位符。
请将候选人的姓名设置为："${candidateName || '求职候选人'}"。
请将微信和手机号设置为："${candidatePhone || '13800000000'}" (微信同号)。
自定义保存文件名 customPdfName 必须严格遵守格式: "${targetJobName}_${candidateName || '求职候选人'}_${candidatePhone || '13800000000'}（微信同号）"（必须要具体拼合好具体字符串，禁止含有 brackets 或 placeholder 占位符）。

🚨【极其重要，必须100%强制执行】：
- 仅输出纯粹的 JSON 字符串（可以直接在 JavaScript 环境中解析成 Object）。
- 绝不包裹在任何 \`\`\` 格式的 Markdown 标注内，绝不带有任何多余的前缀、后缀或解释文字。`;

    const provider = process.env.AI_PROVIDER || "gemini";
    let data: any;

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(400).json({ error: "系统后端被配置为使用备用模型，但未配置 OPENAI_API_KEY。" });
      const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
      const model = process.env.OPENAI_MODEL || "gpt-5-mini";

      const schemaTemplate = `{
  "inquiryScripts": {
    "steady": "稳重型投递话术 (80-120字)，不带有任何括号占位符",
    "active": "主动进攻型投递话术 (80-120字)，不带有任何括号占位符",
    "casual": "轻沟通型投递话术 (80-120字)，不带有任何括号占位符"
  },
  "prepStrategy": {
    "skillsGap": ["具体核心能力缺口 1", "具体核心能力缺口 2"],
    "sevenDayPlan": [{
      "day": 1,
      "focus": "今日学习/训练主线描述",
      "learn": "今日具体注入的硬核行业术语或知识点",
      "practice": "今日模拟实战演练任务",
      "output": "今日产出的仿真成果/有形资产"
    }],
    "portfolioMaterials": [{
      "type": "具体的有形作品标题",
      "description": "说明该材料正好对焦了转行的何种敏感疑惑",
      "value": "说明实则证明了对方成熟的哪一项基本功",
      "templateExample": "包含此方案的具体实操大纲框架或样例标准"
    }]
  },
  "resumeDetails": {
    "personalInfo": {
      "name": "${candidateName || '李明'}",
      "jobTitle": "${targetJobName}",
      "phone": "${candidatePhone || '13800000000'}",
      "wechat": "${candidatePhone || '13800000000'}",
      "email": "resume_example@example.com",
      "location": "目标工作城市",
      "customPdfName": "${targetJobName}_${candidateName || '李明'}_${candidatePhone || '13800000000'}（微信同号）"
    },
    "intro": "一两句强匹配的个人转行说服自述说明",
    "coreSkills": [{ "name": "可迁移能力词汇", "description": "结合实际数字简述该技能在新岗位的即刻可用性。" }],
    "workExperiences": [{
      "company": "过往具体的真实或高度仿真公司名称",
      "role": "担任角色 / 匹配新岗位的头衔",
      "duration": "起止时间(如: 2021.03 - 2024.01)",
      "highlight": "说明在任期里如何锻炼了完美应用于新行新岗位的底层能力、情商或管理心法",
      "achievements": ["基于 STAR 的具体成就行文"]
    }],
    "portfolioProject": {
      "name": "拟真设计 or 做过的主导项目名称",
      "role": "所担当的角色",
      "description": "针对核心痛点及主要解决抓手思路的简明包装",
      "outputs": ["仿真交付物清单描述 1", "仿真交付物清单描述 2"]
    },
    "educationList": [{
      "school": "南京工商大学 / 示范理工学院",
      "major": "工商管理 / 计算机科学与技术",
      "degree": "学士 / 硕士 / 本科",
      "duration": "2016.09 - 2020.06"
    }]
  }
}`;

      const openAiSystemInstruction = systemInstruction +
        `\n\n🚨🚨🚨【极其重要，强制执行的输出 JSON 的 key 结构模板规范】🚨🚨🚨\n` +
        `你必须并且只能输出完美的 JSON 纯文本对象，它的 root 及 nested key 必须跟下面的 key 拼写、命名等完全一致 (驼峰命名拼写, 不能有任何遗漏或改写)：\n` +
        schemaTemplate +
        `\n\n请保证：\n` +
        `1. 所有返回的 JSON 键值和层级关系与上方指定模板完全一致。\n` +
        `2. 绝对不能使用 \`\`\`json 或 \`\`\` 格式的 Markdown 包裹返回结果，只向我发送标准的 JSON 纯文本字符串！\n` +
        `3. 绝对不带有任何多余的前缀、后缀或前后的言语解释论述。`;

      console.log(`[AI-BACKUP] Calling OpenAI-compatible Client API: Base=${apiBase}, Model=${model}`);

      const resp = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: openAiSystemInstruction }, { role: "user", content: userPrompt }],
          temperature: 0.85,
        }),
      });
      if (!resp.ok) throw new Error(`备选 API 返回 HTTP ${resp.status}: ${await resp.text()}`);
      const rawJson: any = await resp.json();
      const outputText = rawJson.choices?.[0]?.message?.content;
      if (!outputText) throw new Error("备选 AI 接口响应中未找到 content 字段值。");
      data = JSON.parse(cleanJsonString(outputText));
    } else {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: transitionResultSchema as any, temperature: 0.85 },
      });
      const outputText = response.text;
      if (!outputText) throw new Error("模型未正常返回任何内容。");
      data = JSON.parse(cleanJsonString(outputText));
    }

    if (usageType === "free") await consumeUserQuota(user.id);
    else await consumeUserQuota(user.id, paymentIdToUse);

    return res.json(data);
  } catch (error: any) {
    console.error("AI transition API Error:", error);
    const friendly = (error instanceof SyntaxError || error?.message?.includes("JSON") || error?.message?.includes("position"))
      ? "系统繁忙，请重新尝试。" : (error.message || "后端AI异常。");
    return res.status(500).json({ error: friendly });
  }
});

// ─── Vite 中间件 / 生产静态服务 ──────────────────────────────

async function setupServer() {
  try { await initDatabase(); }
  catch (error) { console.warn("Database not available — API features requiring DB will be disabled. Error:", (error as any)?.message); }

  if (!isProduction) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server on http://127.0.0.1:${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}

setupServer();
