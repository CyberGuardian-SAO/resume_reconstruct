/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TransitionInput {
  targetJobName: string;
  jobDescription: string;
  candidateBackground: string;
}

export interface InquiryScript {
  steady: string; // 稳重型 (适合传统行业, 80-120字)
  active: string; // 主动进攻型 (适合服务业/运营/销售, 80-120字)
  casual: string; // 轻沟通型 (适合门店/基础岗位, 80-120字)
}

export interface DayPlan {
  day: number;
  focus: string; // 每日焦点
  learn: string; // 学习/熟悉什么
  practice: string; // 模拟/练习什么
  output: string; // 输出与沉淀
}

export interface PortfolioMaterial {
  type: string; // 证明材料名称
  description: string; // 为什么关键/对应什么招聘痛点
  value: string; // 证明价值/效果
  templateExample: string; // 样例/模版内容
}

export interface PrepStrategy {
  skillsGap: string[]; // 核心能力缺口 (直接点破, 招聘方最在意的痛点)
  sevenDayPlan: DayPlan[]; // 7天速成速成方案 (1-7天每日具体内容)
  portfolioMaterials: PortfolioMaterial[]; // 必须准备的证明材料
}

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  highlight: string; // 转型亮点 (在这个岗位提炼出对目标岗位极具价值的亮点描述)
  achievements: string[]; // 成果描述，必须是 "行为+结果" 场景化表达
}

export interface PortfolioProject {
  name: string; // 项目/模拟案例名称
  role: string; // 负责角色 (体现专业度)
  description: string; // 案例场景与痛点解决
  outputs: string[]; // 仿真交付物清单 (极其像业内人)
}

export interface RestructuredResume {
  personalInfo: {
    name: string;
    jobTitle: string;
    phone: string;
    wechat: string;
    email: string;
    location: string;
    customPdfName: string; // 格式: "岗位名称_郭鑫_15323411996（微信同号）"
  };
  intro: string; // 转型说明 (合理化转型，降低招聘方风险判断)
  coreSkills: { name: string; description: string }[]; // 重点提炼的可迁移核心能力与工具
  workExperiences: WorkExperience[]; // 重构后的工作经历 (强匹配目标JD)
  portfolioProject: PortfolioProject; // 专门制作的模拟案例或项目说明
}

export interface TransitionResult {
  inquiryScripts: InquiryScript;
  prepStrategy: PrepStrategy;
  resumeDetails: RestructuredResume;
}
