/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure the local dev server is running properly
const isProduction = process.env.NODE_ENV === "production";
const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please add it via Secrets configuration.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Defining the JSON response schema for Gemini, fully matching the src/types.ts TransitionResult definition.
const transitionResultSchema = {
  type: Type.OBJECT,
  properties: {
    inquiryScripts: {
      type: Type.OBJECT,
      properties: {
        steady: { 
          type: Type.STRING, 
          description: "稳重型投递话术 (80-120字)，适合传统、严谨行业。强合理化跨行合理性，强调底层稳定的抗压及踏实执行力，语气专业周密。绝对不包含任何 brackets 占位符。" 
        },
        active: { 
          type: Type.STRING, 
          description: "主动进攻型投递话术 (80-120字)，适合互联网、服务业、销售。成交导向，强调对该品牌的精细调研，带出过往高业务增长或执行细节，显露自信进取的气质。绝对不包含任何 brackets 占位符。" 
        },
        casual: { 
          type: Type.STRING, 
          description: "轻沟通型投递话术 (80-120字)，适合门店、初级基础岗位。快捷高效，直接点明最贴切目标岗位最强悍的一个技能，以‘顺带问一句’的语气，完成自我成交。绝对不包含任何 brackets 占位符。" 
        }
      },
      required: ["steady", "active", "casual"]
    },
    prepStrategy: {
      type: Type.OBJECT,
      properties: {
        skillsGap: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "直接点明候选人在匹配该JD时的核心能力缺口 (2-4条)，无需委婉客气，正中招聘单位痛点。字词需专业。"
        },
        sevenDayPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER, description: "天数 (1到7)" },
              focus: { type: Type.STRING, description: "今日学习/训练主线" },
              learn: { type: Type.STRING, description: "硬核知识注入 (如行业行话、关键指标公式、工具使用等)" },
              practice: { type: Type.STRING, description: "模拟实战演练 (如模拟排班、推算转化率、客诉实战复盘等)" },
              output: { type: Type.STRING, description: "今日有形资产产出 (如一套预备的门店排班excel草稿、一个活动构想短案、一个基础服务SOP表格等)" }
            },
            required: ["day", "focus", "learn", "practice", "output"]
          }
        },
        portfolioMaterials: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "证明材料名称 (如: 一个下午绘制的《门店日常开关店及服务标准SOP流程手册》/ 一张《某区域奶茶店竞品周活动拆解及改进构想》)" },
              description: { type: Type.STRING, description: "痛点对焦 (说明这份证明材料，正好应对了招聘方看你转行时的哪一项最敏感的风险疑惑)" },
              value: { type: Type.STRING, description: "隐藏能力证明 (表面看是一份方案，实则无声展示了你具备过硬的什么专业基本功)" },
              templateExample: { type: Type.STRING, description: "一个具体而微的大纲或样本示范。不要只给概念描述，要写出实际可用的大概结构、指标设定，让人能直接顺着写。绝对不包含任何 brackets 占位符。" }
            },
            required: ["type", "description", "value", "templateExample"]
          }
        }
      },
      required: ["skillsGap", "sevenDayPlan", "portfolioMaterials"]
    },
    resumeDetails: {
      type: Type.OBJECT,
      properties: {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "候选人姓名，如果没有，默认为 郭鑫" },
            jobTitle: { type: Type.STRING, description: "求职目标岗位名称（强匹配JD）" },
            phone: { type: Type.STRING, description: "电话，默认为 15323411996" },
            wechat: { type: Type.STRING, description: "微信，默认为 15323411996" },
            email: { type: Type.STRING, description: "邮箱，默认为 guoxin199604@gmail.com" },
            location: { type: Type.STRING, description: "意向工作地（城市）" },
            customPdfName: { type: Type.STRING, description: "PDF下载文件的自定义保存名，格式必须严格遵循: 岗位名称_郭鑫_15323411996（微信同号）" }
          },
          required: ["name", "jobTitle", "phone", "wechat", "email", "location", "customPdfName"]
        },
        intro: { 
          type: Type.STRING, 
          description: "精短极具说服力的个人转型自述。合理解释为何选择此行业以及自己的过往技能由于何种底层共通性可以完美接轨（合理化转型、一句话消解招聘官的担忧风险）" 
        },
        coreSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "迁移能力词 (如：敏锐客诉防范与快速挽回、高压团队排班与动态人力微调、数字化库存精细运营等)" },
              description: { type: Type.STRING, description: "结合过往成熟案例，用数字简述技能成熟度，说明对新职位的即刻可用性。" }
            },
            required: ["name", "description"]
          }
        },
        workExperiences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING, description: "过往公司，不要胡乱编造不符合实际的名字，依据候选人背景起一个写实的代号或沿用背景" },
              role: { type: Type.STRING, description: "在此公司时的具体原岗位" },
              duration: { type: Type.STRING, description: "在职起止时间" },
              highlight: { type: Type.STRING, description: "跨行业迁移核心亮点提炼（例如：利用互联网精细服务考核重组排班，原客服工作其实无缝沉淀了极强的高频调度、纠纷降级基本功）" },
              achievements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "重构后的行为结果（一般3条左右）。严格满足“行为+结果”原则，展现数据化、细节、不卑不亢的执行成效，直击目标JD需要"
              }
            },
            required: ["company", "role", "duration", "highlight", "achievements"]
          }
        },
        portfolioProject: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "一个仿真重磅求职模拟武器/案例名称 (必须极其对口目标岗位职责和痛点，例如：某品牌连锁茶饮门店单店开业前7天极速冷启动规划案、某区域客服话术标准化调优项目)" },
            role: { type: Type.STRING, description: "候选人展现的具体角色名（表明主导思维）" },
            description: { type: Type.STRING, description: "该项目的核心攻坚点，如：如何在短时间内在冷启动中通过客群引流和排班联动降低日常人力耗散12%，并提升15%顾客回头率" },
            outputs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "输出的一组硬核真实交付成果（3-4个点）。如《第一周单店引流裂变模型排班SOP表》《模拟门店客诉降级三步金句本》《全员服务工时灵活调剂规划器》"
            }
          },
          required: ["name", "role", "description", "outputs"]
        }
      },
      required: ["personalInfo", "intro", "coreSkills", "workExperiences", "portfolioProject"]
    }
  },
  required: ["inquiryScripts", "prepStrategy", "resumeDetails"]
};

const app = express();
app.use(express.json());

// Main API handler for transition strategies
app.post("/api/transition", async (req, res) => {
  try {
    const { targetJobName, jobDescription, candidateBackground, candidateName, candidatePhone } = req.body;

    if (!targetJobName || !jobDescription || !candidateBackground) {
      return res.status(400).json({ error: "岗位名称、岗位描述 (JD) 和 候选人情况 均为必填项。" });
    }

    const ai = getAiClient();

    const systemInstruction = `你是一位享誉全球的跨行业求职策略专家、顶尖招聘经理（招聘方思维模拟器）以及简历精重构大师。

今天，你需要帮助一位跨行转型的候选人，将其经历包装重构成最抓主考官眼球、天然降低招聘方“跨行高风险、上手慢、不持久、不稳定”疑虑的硬核候选人。

请你充分分析目标候选人的情况（技能/经验/跨行原因）和目标岗位的职责/JD。随后，利用招聘圈资深眼光，输出匹配度最高、字字珠玑、毫无水分的专业解答。

🚨 【极其重要】：所有输出的文本中，严禁包含类似以下括号格式 of placeholders:
- "[具体时间]" / "[具体数据]" / "[公司名称]" / "[岗位名称]"等
所有数据和名称必须是依据候选人的原始输入、结合对应行业常识，生成的高度逼真、丰满、合理的“拟真数据（如 客服组长管理24人团队、促使顾客投诉流失降低34%、提升日常排程周转率等）”和具体的细节。

【1. 求职话术策略】
- 提供包含3个风格的高情商话术 (各自控制在 80-120 字)：
  1. 稳重型（沉稳踏实，适合传统偏严谨行业，展现耐劳力与高度自驱及成长周期）
  2. 主动进攻型（求战心切，适合销售营运或轻资产服务业，主动展露对目标品牌的深度分析，自我成交）
  3. 轻沟通型（门店、轻资产零售或基础性岗位，亲和爽快，顺带抛出自己能立即上岗或最顺手的干货技能）
- 严禁任何乞求感或自惭形秽。语气不卑不亢，让招人方感受到极高的职场情商和直接可用性。

【2. 7天速成方案 & 证明材料】
- 招聘官最在乎的事情是什么？从跨行视角明确指出其“核心能力缺口”（2-4条）。字词必须刺中要害（不要客气）。
- 设计极具实操性、精确到每一天的「7天超强度行军备战方案」。包含学什么、练什么、输出什么。
- 设定不可拒绝的「仿真证明材料 / 个人作品」。例如如果是餐饮门店岗位，模拟一份排餐考核、一个客诉处理金句包；如果是运营，给出一个引流方案草案等。并在 answers 里提供非常详细、有条理的可落地参考样例大纲。

【3. 定制简历重构】
- 重新编辑候选人原本跟目标JD毫无关联或是偏向旧行业的经历细节。
- 将经历里的核心职责转化为目标岗位亟需的「可迁移能力」（例如：将“客服接待”重构为“高负荷客诉妥善回转、标准化服务流程管理与人力负荷调配”）。
- 用场景化与定量的数据指标来强化每个点，充分贯彻「行为 + 结果」或「STAR」原则描述。
- 个人简介部分必须具备高度的战略合理化，一语击碎对方跨界风险的刻板印象。
- 提供专门针对此岗位设计、包装的一个「模拟/仿真项目或作业案例」，里面包含清晰的产出物名字，极其逼真。`;

    const userPrompt = `【求职目标岗位名称】：
${targetJobName}

【目标岗位职责及JD要求】：
${jobDescription}

【候选人当前情况（背景/原行业技能/跨行转型原因）】：
${candidateBackground}

请针对以上输入，生成包含求职问询话术、备战计划配置和重构简历的完整转型企划案 JSON。请确保所有字段的数据高度详实逼真，严禁使用 placeholder 类型的占位符。
请将候选人的姓名设置为："${candidateName || '求职候选人'}"。
请将微信和手机号设置为："${candidatePhone || '13600000000'}" (微信同号)。
自定义保存文件名 customPdfName 必须严格遵守格式: "${targetJobName}_${candidateName || '求职候选人'}_${candidatePhone || '13600000000'}（微信同号）"（必须要具体拼合好具体字符串，禁止含有 brackets 或 placeholder 占位符）。`;

    const provider = process.env.AI_PROVIDER || "gemini";
    let data;

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "系统后端被配置为使用备用模型，但未配置 OPENAI_API_KEY。请在 Web UI Secrets 中进行配置。" });
      }
      const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
      const model = process.env.OPENAI_MODEL || "gpt-5-mini";

      console.log(`[AI-BACKUP] Calling OpenAI-compatible Client API: Base=${apiBase}, Model=${model}`);
      
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          response_format: { type: "json_object" },
          messages: [
            { 
              role: "system", 
              content: systemInstruction + "\n🚨极其重要：请返回符合接口规范的纯 JSON 对象字符串，千万不要包裹在 Markdown 代码块内。" 
            },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.85
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`备选 API 提供商返回 HTTP ${response.status}: ${errText}`);
      }

      const rawJson: any = await response.json();
      const outputText = rawJson.choices?.[0]?.message?.content;
      if (!outputText) {
        throw new Error("备选 AI 接口响应中未找到 content 字段值。");
      }
      data = JSON.parse(outputText.trim());
    } else {
      // Default: Google Gemini SDK call
      const ai = getAiClient();
      console.log("[AI-DEFAULT] Calling Google Gemini SDK with 'gemini-3.5-flash'.");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: transitionResultSchema as any,
          temperature: 0.85,
        },
      });

      const outputText = response.text;
      if (!outputText) {
        throw new Error("模型未正常返回任何内容。");
      }
      data = JSON.parse(outputText.trim());
    }

    return res.json(data);

  } catch (error: any) {
    console.error("AI transition API Error (Global Handler):", error);
    return res.status(500).json({ error: error.message || "后端AI处理重构简历时发生异常，请检查配置或稍后重试。" });
  }
});

// Configure Vite middleware flow or production static loading
async function setupServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application successfully listening on http://0.0.0.0:${PORT} [ENV: ${process.env.NODE_ENV || "development"}]`);
  });
}

setupServer();
