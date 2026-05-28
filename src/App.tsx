/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Briefcase, 
  Sparkles, 
  Flame, 
  Send, 
  Copy, 
  Check, 
  FileText, 
  Calendar, 
  Download, 
  AlertTriangle, 
  Users, 
  Bookmark, 
  Smartphone, 
  Mail, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Award,
  BookOpen,
  Layers,
  FileCheck,
  Trash2,
  X,
  Lock,
  AlertCircle,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { demoExamples } from "./examplesData";
import { TransitionResult, RestructuredResume, WorkExperience, PortfolioProject, Education } from "./types";
import { WeChatWidget } from "./components/WeChatWidget";
import AuthModal from "./components/AuthModal";
import PaymentModal from "./components/PaymentModal";

function generateNewSessionToken(): string {
  return "session_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function App() {
  const [sessionToken, setSessionToken] = useState(() => {
    return localStorage.getItem("sessionToken") || "";
  });
  const [candidateName, setCandidateName] = useState("求职候选人");
  const [candidatePhone, setCandidatePhone] = useState("13800000000");
  const [authPhone, setAuthPhone] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [freeQuota, setFreeQuota] = useState<number | null>(null);
  const [paidQuota, setPaidQuota] = useState<number | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [paymentOrderNo, setPaymentOrderNo] = useState<string>("");
  const [paymentCodeUrl, setPaymentCodeUrl] = useState<string>("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedQRCode, setCopiedQRCode] = useState(false);

  const [targetJobName, setTargetJobName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateBackground, setCandidateBackground] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransitionResult | null>(null);
  const [editableResume, setEditableResume] = useState<RestructuredResume | null>(null);
  const [currentTab, setCurrentTab] = useState<"scripts" | "strategy" | "resume">("scripts");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const [isEditing, setIsEditing] = useState(true);
  const [showResumeFooter, setShowResumeFooter] = useState(true);
  const [resumeFooterLeft, setResumeFooterLeft] = useState("由 “AI 跨行简历重构与核心匹配系统” 精选重排并渲染");
  const [resumeFooterRight, setResumeFooterRight] = useState("本简历已通过标准化职业迁移性校验");
  const [unseenTabs, setUnseenTabs] = useState<Set<string>>(new Set(["strategy", "resume"]));
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Resume State setters for real-time live editing
  const updatePersonalInfo = (field: keyof RestructuredResume["personalInfo"], value: string) => {
    if (!editableResume) return;
    const updated = {
      ...editableResume,
      personalInfo: {
        ...editableResume.personalInfo,
        [field]: value
      }
    };
    setEditableResume(updated);
    if (field === "name") {
      setCandidateName(value);
    } else if (field === "phone") {
      setCandidatePhone(value);
    }
  };

  const updateIntro = (value: string) => {
    if (!editableResume) return;
    setEditableResume({
      ...editableResume,
      intro: value
    });
  };

  const updateCoreSkill = (index: number, field: "name" | "description", value: string) => {
    if (!editableResume) return;
    const newSkills = [...editableResume.coreSkills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setEditableResume({ ...editableResume, coreSkills: newSkills });
  };

  const addCoreSkill = () => {
    if (!editableResume) return;
    setEditableResume({
      ...editableResume,
      coreSkills: [...editableResume.coreSkills, { name: "新核心迁移能力", description: "输入详细的说服或匹配描述（突出可复用的管理、策划、分析或交付产物）" }]
    });
  };

  const removeCoreSkill = (index: number) => {
    if (!editableResume) return;
    const newSkills = editableResume.coreSkills.filter((_: any, i: number) => i !== index);
    setEditableResume({ ...editableResume, coreSkills: newSkills });
  };

  const addWorkExperience = () => {
    if (!editableResume) return;
    setEditableResume({
      ...editableResume,
      workExperiences: [
        ...editableResume.workExperiences,
        {
          company: "新过往公司名称",
          role: "担任的角色/目标强匹配化称谓",
          duration: "2024.01 - 至今",
          highlight: "阐述在这个岗位上沉淀的可立刻平移到目标岗的王牌属性...",
          achievements: ["利用 STAR 框架补充您的实操方案、量化细节，字数约 30-70"]
        }
      ]
    });
  };

  const removeWorkExperience = (index: number) => {
    if (!editableResume) return;
    const newXps = editableResume.workExperiences.filter((_: any, i: number) => i !== index);
    setEditableResume({ ...editableResume, workExperiences: newXps });
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    if (!editableResume) return;
    const newXps = [...editableResume.workExperiences];
    newXps[index] = { ...newXps[index], [field]: value };
    setEditableResume({ ...editableResume, workExperiences: newXps });
  };

  const updateAchievement = (xpIndex: number, achIndex: number, value: string) => {
    if (!editableResume) return;
    const newXps = [...editableResume.workExperiences];
    const newAchs = [...newXps[xpIndex].achievements];
    newAchs[achIndex] = value;
    newXps[xpIndex] = { ...newXps[xpIndex], achievements: newAchs };
    setEditableResume({ ...editableResume, workExperiences: newXps });
  };

  const addAchievement = (xpIndex: number) => {
    if (!editableResume) return;
    const newXps = [...editableResume.workExperiences];
    newXps[xpIndex] = { ...newXps[xpIndex], achievements: [...newXps[xpIndex].achievements, "输入新工作成果成果的描述，推荐遵守 行为+结果 or STAR 原则"] };
    setEditableResume({ ...editableResume, workExperiences: newXps });
  };

  const removeAchievement = (xpIndex: number, achIndex: number) => {
    if (!editableResume) return;
    const newXps = [...editableResume.workExperiences];
    const newAchs = newXps[xpIndex].achievements.filter((_: any, i: number) => i !== achIndex);
    newXps[xpIndex] = { ...newXps[xpIndex], achievements: newAchs };
    setEditableResume({ ...editableResume, workExperiences: newXps });
  };

  const updatePortfolioProject = (field: keyof PortfolioProject, value: any) => {
    if (!editableResume) return;
    setEditableResume({
      ...editableResume,
      portfolioProject: {
        ...editableResume.portfolioProject,
        [field]: value
      }
    });
  };

  const updateProjectOutput = (outIndex: number, value: string) => {
    if (!editableResume) return;
    const newOutputs = [...editableResume.portfolioProject.outputs];
    newOutputs[outIndex] = value;
    setEditableResume({
      ...editableResume,
      portfolioProject: {
        ...editableResume.portfolioProject,
        outputs: newOutputs
      }
    });
  };

  const addProjectOutput = () => {
    if (!editableResume) return;
    setEditableResume({
      ...editableResume,
      portfolioProject: {
        ...editableResume.portfolioProject,
        outputs: [...editableResume.portfolioProject.outputs, "新增的可用高精模拟交付文件或作品"]
      }
    });
  };

  const removeProjectOutput = (outIndex: number) => {
    if (!editableResume) return;
    const newOutputs = editableResume.portfolioProject.outputs.filter((_: any, i: number) => i !== outIndex);
    setEditableResume({
      ...editableResume,
      portfolioProject: {
        ...editableResume.portfolioProject,
        outputs: newOutputs
      }
    });
  };

  const addEducation = () => {
    if (!editableResume) return;
    const currentEduList = editableResume.educationList || [];
    setEditableResume({
      ...editableResume,
      educationList: [
        ...currentEduList,
        {
          school: "您的毕业学校名称",
          major: "主修专业",
          degree: "本科 / 大专 / 硕士 / 博士",
          duration: "2016.09 - 2020.06"
        }
      ]
    });
  };

  const removeEducation = (index: number) => {
    if (!editableResume) return;
    const currentEduList = editableResume.educationList || [];
    const newEdu = currentEduList.filter((_: any, i: number) => i !== index);
    setEditableResume({ ...editableResume, educationList: newEdu });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    if (!editableResume) return;
    const currentEduList = editableResume.educationList || [];
    const newEdu = [...currentEduList];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setEditableResume({ ...editableResume, educationList: newEdu });
  };

  // Quick-load demo example
  const handleLoadExample = (exampleIndex: number) => {
    const ex = demoExamples[exampleIndex];
    setTargetJobName(ex.targetJobName);
    setJobDescription(ex.jobDescription);
    setCandidateBackground(ex.candidateBackground);
    setError(null);
  };

  // Helper function to robustly normalize model outputs and fallback properties
  const normalizeTransitionResult = (data: any): TransitionResult => {
    // 1. Resolve casing differences (e.g., snake_case vs camelCase from backup APIs)
    const rawInquiryScripts = data?.inquiryScripts || data?.inquiry_scripts || {};
    const rawPrepStrategy = data?.prepStrategy || data?.prep_strategy || {};
    const rawResumeDetails = data?.resumeDetails || data?.resume_details || {};

    const normalized: TransitionResult = {
      inquiryScripts: {
        steady: rawInquiryScripts.steady || rawInquiryScripts.steady_style || "",
        active: rawInquiryScripts.active || rawInquiryScripts.active_style || "",
        casual: rawInquiryScripts.casual || rawInquiryScripts.casual_style || "",
      },
      prepStrategy: {
        skillsGap: Array.isArray(rawPrepStrategy.skillsGap) 
          ? rawPrepStrategy.skillsGap 
          : Array.isArray(rawPrepStrategy.skills_gap) 
            ? rawPrepStrategy.skills_gap 
            : [],
        sevenDayPlan: Array.isArray(rawPrepStrategy.sevenDayPlan) 
          ? rawPrepStrategy.sevenDayPlan 
          : Array.isArray(rawPrepStrategy.seven_day_plan) 
            ? rawPrepStrategy.seven_day_plan 
            : [],
        portfolioMaterials: Array.isArray(rawPrepStrategy.portfolioMaterials) 
          ? rawPrepStrategy.portfolioMaterials 
          : Array.isArray(rawPrepStrategy.portfolio_materials) 
            ? rawPrepStrategy.portfolio_materials 
            : [],
      },
      resumeDetails: {
        personalInfo: {
          name: rawResumeDetails?.personalInfo?.name || rawResumeDetails?.personal_info?.name || candidateName || "求职候选人",
          jobTitle: rawResumeDetails?.personalInfo?.jobTitle || rawResumeDetails?.personal_info?.job_title || targetJobName || "",
          phone: rawResumeDetails?.personalInfo?.phone || rawResumeDetails?.personal_info?.phone || candidatePhone || "13800000000",
          wechat: rawResumeDetails?.personalInfo?.wechat || rawResumeDetails?.personal_info?.wechat || candidatePhone || "13800000000",
          email: rawResumeDetails?.personalInfo?.email || rawResumeDetails?.personal_info?.email || "resume_example@example.com",
          location: rawResumeDetails?.personalInfo?.location || rawResumeDetails?.personal_info?.location || "",
          customPdfName: rawResumeDetails?.personalInfo?.customPdfName || rawResumeDetails?.personal_info?.custom_pdf_name || "",
        },
        intro: rawResumeDetails?.intro || rawResumeDetails?.personal_intro || "",
        coreSkills: Array.isArray(rawResumeDetails?.coreSkills) 
          ? rawResumeDetails.coreSkills 
          : Array.isArray(rawResumeDetails?.core_skills) 
            ? rawResumeDetails.core_skills 
            : [],
        workExperiences: Array.isArray(rawResumeDetails?.workExperiences) 
          ? rawResumeDetails.workExperiences 
          : Array.isArray(rawResumeDetails?.work_experiences) 
            ? rawResumeDetails.work_experiences 
            : [],
        portfolioProject: {
          name: rawResumeDetails?.portfolioProject?.name || rawResumeDetails?.portfolio_project?.name || "",
          role: rawResumeDetails?.portfolioProject?.role || rawResumeDetails?.portfolio_project?.role || "",
          description: rawResumeDetails?.portfolioProject?.description || rawResumeDetails?.portfolio_project?.description || "",
          outputs: Array.isArray(rawResumeDetails?.portfolioProject?.outputs) 
            ? rawResumeDetails.portfolioProject.outputs 
            : Array.isArray(rawResumeDetails?.portfolio_project?.outputs) 
              ? rawResumeDetails.portfolio_project.outputs 
              : [],
        },
        educationList: Array.isArray(rawResumeDetails?.educationList) 
          ? rawResumeDetails.educationList 
          : Array.isArray(rawResumeDetails?.education_list) 
            ? rawResumeDetails.education_list 
            : Array.isArray(rawResumeDetails?.education) 
              ? rawResumeDetails.education 
              : [
                  {
                    school: "江南名校/示范大学",
                    major: "计算机科学与技术 / 工商管理",
                    degree: "本科",
                    duration: "2016.09 - 2020.06"
                  }
                ],
      }
    };

    // 2. Perform validation clean ups on nesting items
    normalized.prepStrategy.sevenDayPlan = normalized.prepStrategy.sevenDayPlan.map((d: any) => ({
      day: Number(d.day) || 1,
      focus: d.focus || "",
      learn: d.learn || d.learn_what || "",
      practice: d.practice || d.practice_what || "",
      output: d.output || d.deliverable || ""
    }));

    normalized.prepStrategy.portfolioMaterials = normalized.prepStrategy.portfolioMaterials.map((m: any) => ({
      type: m.type || m.name || "",
      description: m.description || m.pain_point || "",
      value: m.value || m.proving_power || "",
      templateExample: m.templateExample || m.template_example || m.example || ""
    }));

    normalized.resumeDetails.workExperiences = normalized.resumeDetails.workExperiences.map((xp: any) => ({
      company: xp.company || "",
      role: xp.role || "",
      duration: xp.duration || xp.time || "",
      highlight: xp.highlight || xp.value_add || "",
      achievements: Array.isArray(xp.achievements) ? xp.achievements : []
    }));

    normalized.resumeDetails.educationList = normalized.resumeDetails.educationList.map((edu: any) => ({
      school: edu.school || edu.univ || "江南名校/示范大学",
      major: edu.major || "工商管理",
      degree: edu.degree || "本科",
      duration: edu.duration || "2016.09 - 2020.06"
    }));

    return normalized;
  };

  const fetchUsageStatus = async (token: string) => {
    try {
      const response = await fetch("/api/usage/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("无法获取使用状态");
      }

      const data = await response.json();
      setFreeQuota(typeof data.freeQuota === "number" ? data.freeQuota : null);
      setPaidQuota(typeof data.availablePaidQuota === "number" ? data.availablePaidQuota : null);
      setIsLoggedIn(true);
      setAuthMessage("已注册，首次验证成功赠送1次免费额度。");
    } catch (err: any) {
      console.error("fetchUsageStatus error", err);
      setIsLoggedIn(false);
      setFreeQuota(null);
      setPaidQuota(null);
      if (err.message?.includes("401")) {
        setAuthMessage("当前会话已失效，请重新注册。");
        localStorage.removeItem("sessionToken");
        setSessionToken("");
      }
    }
  };

  const handleSendCode = async () => {
    if (!authPhone.trim()) {
      setAuthMessage("请输入手机号以接收验证码。");
      return;
    }
    if (!authPassword.trim() || authPassword.trim().length < 6) {
      setAuthMessage("密码最低6位。");
      return;
    }
    if (authPassword.trim() !== authPasswordConfirm.trim()) {
      setAuthMessage("两次输入的密码不一致。");
      return;
    }
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone.trim(), password: authPassword.trim(), passwordConfirm: authPasswordConfirm.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "验证码发送失败，请稍后重试。");
      }

      setAuthMessage("验证码已发送，请注意查收。首次注册验证成功可获得1次免费额度。");
    } catch (err: any) {
      console.error("handleSendCode error", err);
      setAuthMessage(err.message || "验证码发送失败。");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!authPhone.trim() || !authCode.trim()) {
      setAuthMessage("请输入手机号和短信验证码完成注册。");
      return;
    }
    if (!authPassword.trim() || authPassword.trim().length < 6) {
      setAuthMessage("密码最低6位。");
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/register/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone.trim(), code: authCode.trim(), password: authPassword.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "验证码验证失败，请检查后重试。");
      }

      const data = await response.json();
      const token = data.sessionToken;
      if (token) {
        setSessionToken(token);
        localStorage.setItem("sessionToken", token);
        setIsLoggedIn(true);
        setCandidatePhone(authPhone.trim());
        await fetchUsageStatus(token);
        setShowAuthModal(false);
      }
      setAuthMessage("注册成功。已为首次注册用户赠送1次免费额度。");
      setAuthCode("");
      setAuthPassword("");
      setAuthPasswordConfirm("");
    } catch (err: any) {
      console.error("handleVerifyCode error", err);
      setAuthMessage(err.message || "验证码验证失败。");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!authPhone.trim()) {
      setAuthMessage("请输入手机号。");
      return;
    }
    if (!authPassword.trim() || authPassword.trim().length < 6) {
      setAuthMessage("密码最低6位。");
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone.trim(), password: authPassword.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "登录失败，请检查后重试。");
      }

      const data = await response.json();
      const token = data.sessionToken;
      if (token) {
        setSessionToken(token);
        localStorage.setItem("sessionToken", token);
        setIsLoggedIn(true);
        setCandidatePhone(authPhone.trim());
        await fetchUsageStatus(token);
        setShowAuthModal(false);
      }
      setAuthMessage("登录成功。");
      setAuthCode("");
    } catch (err: any) {
      console.error("handleLogin error", err);
      setAuthMessage(err.message || "登录失败。");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!sessionToken) {
      setShowAuthModal(true);
      return;
    }
    if (freeQuota !== 0) {
      setPaymentStatusMessage("您还有免费额度，无需支付。");
      return;
    }
    // 用户无额度时直接创建订单，不再显示确认弹窗
    setShowPaymentModal(true);
    setPaymentLoading(true);
    setPaymentStatusMessage(null);
    setCopiedQRCode(false);

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ amountCents: 100, description: "一次付费使用简历重构服务" }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "微信支付订单创建失败。");
      }

      const data = await response.json();
      const newOrder = data.paymentId || "";
      setPaymentOrderNo(newOrder);
      setPaymentCodeUrl(data.codeUrl || "");
      setPaymentStatusMessage("微信支付订单已创建，请扫描二维码完成支付。正在轮询支付状态...（若已支付，请稍候）");
      // Start polling payment status automatically
      pollPaymentStatus(newOrder, sessionToken, 24, 5000);
    } catch (err: any) {
      console.error("handleCreatePayment error", err);
      setPaymentStatusMessage(err.message || "微信支付订单创建失败。");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!sessionToken) {
      setPaymentStatusMessage("请先完成手机号注册后再发起微信支付。");
      return;
    }

    setPaymentLoading(true);
    setPaymentStatusMessage(null);

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ amountCents: 100, description: "一次付费使用简历重构服务" }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "微信支付订单创建失败。");
      }

      const data = await response.json();
      const newOrder = data.paymentId || "";
      setPaymentOrderNo(newOrder);
      setPaymentCodeUrl(data.codeUrl || "");
      setPaymentStatusMessage("微信支付订单已创建，请扫描二维码完成支付。正在轮询支付状态...（若已支付，请稍候）");
      // Start polling payment status automatically
      pollPaymentStatus(newOrder, sessionToken, 24, 5000);
    } catch (err: any) {
      console.error("handleCreatePayment error", err);
      setPaymentStatusMessage(err.message || "微信支付订单创建失败。");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!sessionToken || !paymentOrderNo) {
      setPaymentStatusMessage("请先创建订单，然后再查询支付状态。");
      return;
    }

    try {
      const response = await fetch("/api/payment/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ paymentId: paymentOrderNo }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "查询支付状态失败。");
      }

      const data = await response.json();
      const statusText = data.status === "PAID" ? "已支付" : data.status === "PENDING" ? "待支付" : data.status === "REFUND" ? "已退款" : (data.status || "未知");
      const amountYuan = ((data.amount || 0) / 100).toFixed(2);
      setPaymentStatusMessage(`订单状态：${statusText}，金额：¥${amountYuan}`);
      if (data.status === "PAID") {
        await fetchUsageStatus(sessionToken);
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentStatusMessage(null);
          setPaymentCodeUrl("");
          setCopiedQRCode(false);
          alert("支付成功！额度已到账，您现在可以继续使用服务。");
        }, 500);
      }
    } catch (err: any) {
      console.error("handleCheckPaymentStatus error", err);
      setPaymentStatusMessage(err.message || "查询支付状态失败。");
    }
  };

  // Poll payment status helper: attempts * intervalMs max, call fetchUsageStatus on success
  const pollPaymentStatus = async (paymentId: string, token: string | null, maxAttempts = 12, intervalMs = 5000) => {
    if (!paymentId || !token) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const resp = await fetch("/api/payment/status", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentId }),
        });
        if (resp.ok) {
          const d = await resp.json();
          const statusText = d.status === "PAID" ? "已支付" : d.status === "PENDING" ? "待支付" : d.status === "REFUND" ? "已退款" : (d.status || "未知");
          const amountYuan = ((d.amount || 0) / 100).toFixed(2);
          setPaymentStatusMessage(`订单状态：${statusText}，金额：¥${amountYuan}`);
          if (d.status === "PAID") {
            clearInterval(timer);
            // Refresh usage quotas so UI reflects new paid quota
            await fetchUsageStatus(token);
            // 支付成功后自动关闭弹窗并显示成功提示
            // 注意：保留 paymentOrderNo 不清理，以便后续 /api/transition 能带上 paymentId 消耗额度
            setTimeout(() => {
              setShowPaymentModal(false);
              setPaymentStatusMessage(null);
              setPaymentCodeUrl("");
              setCopiedQRCode(false);
              // 显示支付成功提示
              alert("支付成功！额度已到账，您现在可以继续使用服务。");
            }, 1000);
            return;
          }
        }
      } catch (e) {
        console.error("pollPaymentStatus error", e);
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        setPaymentStatusMessage((s: string | null) => (s ? s + "（轮询已到最大次数，若已支付请手动查询）" : "轮询结束"));
      }
    }, intervalMs);
  };

  useEffect(() => {
    if (sessionToken) {
      fetchUsageStatus(sessionToken);
    }
  }, [sessionToken]);

  // Submit form to express backend API
  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      setShowAuthModal(true);
      return;
    }

    if (freeQuota === 0 && paidQuota === 0) {
      // 无额度时直接创建订单并展示收款码
      setShowPaymentModal(true);
      setPaymentLoading(true);
      setPaymentStatusMessage(null);
      setCopiedQRCode(false);
      try {
        const response = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ amountCents: 100, description: "一次付费使用简历重构服务" }),
        });
        if (response.ok) {
          const data = await response.json();
          const newOrder = data.paymentId || "";
          setPaymentOrderNo(newOrder);
          setPaymentCodeUrl(data.codeUrl || "");
          setPaymentStatusMessage("微信支付订单已创建，请扫描二维码完成支付。正在轮询支付状态...");
          pollPaymentStatus(newOrder, sessionToken, 24, 5000);
        } else {
          const errData = await response.json();
          setPaymentStatusMessage(errData.error || "微信支付订单创建失败。");
        }
      } catch (err: any) {
        console.error("handleGenerateStrategy payment error", err);
        setPaymentStatusMessage(err.message || "微信支付订单创建失败。");
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    if (!targetJobName.trim() || !jobDescription.trim() || !candidateBackground.trim()) {
      setError("请完整填写岗位名称、岗位JD要求以及您的自身经历情况。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          targetJobName,
          jobDescription,
          candidateBackground,
          candidateName,
          candidatePhone,
          ...(freeQuota === 0 && paymentOrderNo ? { paymentId: paymentOrderNo } : {}),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "生成失败，请稍后重试");
      }

      // 从响应header中获取session token（服务端可能因token失效生成了新token）
      const token = response.headers.get("X-Session-Token");
      if (token && token !== sessionToken) {
        setSessionToken(token);
        localStorage.setItem("sessionToken", token);
      }

      const rawJson = await response.json();
      const data = normalizeTransitionResult(rawJson);
      setResult(data);
      setEditableResume(data.resumeDetails);
      setCurrentTab("scripts"); // default view on output load
      // 重置未查看标签提示（②和③未查看）
      setUnseenTabs(new Set(["strategy", "resume"]));
      // 生成结果后自动折叠左侧输入面板，让出更多空间给结果
      setLeftPanelCollapsed(true);
      // // 滚动到页面顶部展示结果
      window.scrollTo({ top: 0, behavior: "smooth" });
      // 调用成功后刷新额度显示
      if (sessionToken) {
        fetchUsageStatus(sessionToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "后端AI处理过程出错，请检查配置或稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  // Safe clipboard helper
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(err => {
      console.error("Copy failed: ", err);
    });
  };

  // Professional client-side PDF Generator (Bypasses iframe sandbox print blockages)
  const handleDownloadPDF = () => {
    if (!editableResume) return;
    setPdfGenerating(true);
    
    const element = document.getElementById("resume-print-area");
    if (!element) {
      alert("未找到可打印的简历区域！请先确保简历区域已渲染。");
      setPdfGenerating(false);
      return;
    }
    
    const originalTitle = document.title;
    const fileName = editableResume.personalInfo.customPdfName || `${targetJobName}_${candidateName}_${candidatePhone}（微信同号）`;
    
    // Set document title temporarily to ensure default save name matches
    document.title = fileName;
    
    const startRendering = () => {
      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        setPdfGenerating(false);
        alert("PDF 转换库正在加载，请稍等 1-2 秒后再次点击！");
        return;
      }
      
      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: `${fileName}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: false 
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };
      
      html2pdf().from(element).set(opt).save().then(() => {
        setPdfGenerating(false);
        document.title = originalTitle;
      }).catch((err: any) => {
        console.error("html2pdf processing failed: ", err);
        setPdfGenerating(false);
        document.title = originalTitle;
        // fallback to standard window.print if library failed
        window.print();
      });
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.integrity = "sha512-VUFz6oG6byisbIuMv9X2N7S+sX4mXbgXn8p0rU0ZkF8JpxR2iFAb8N9nZpYxXpQbgI/FhP1W9gE2gq1uS46/eA==";
      script.crossOrigin = "anonymous";
      script.onload = () => {
        setTimeout(startRendering, 400);
      };
      script.onerror = () => {
        setPdfGenerating(false);
        // Fallback directly to native print if script could not load
        window.print();
      };
      document.body.appendChild(script);
    } else {
      startRendering();
    }
  };

  // Browser Print option (keeps vector text details if requested)
  const handlePrintPDF = () => {
    if (!editableResume) return;
    const originalTitle = document.title;
    const fileName = editableResume.personalInfo.customPdfName || `${targetJobName}_${candidateName}_${candidatePhone}（微信同号）`;
    document.title = fileName;
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 150);
  };

  // Professional client-side Microsoft Word Exporter (.doc format)
  const handleDownloadWord = () => {
    if (!editableResume) return;
    
    const fileName = editableResume.personalInfo.customPdfName || `${targetJobName}_${candidateName}_${candidatePhone}（微信同号）`;

    // Create a beautifully typeset HTML payload for Microsoft Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${editableResume.personalInfo.name} - 个人简历</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: "DengXian", "PingFang SC", "Microsoft YaHei", sans-serif;
            line-height: 1.6;
            color: #1e293b;
            font-size: 10.5pt;
            margin: 90px 72px 90px 72px;
          }
          h1, h2, h3, h4 {
            color: #0f172a;
            margin-top: 14pt;
            margin-bottom: 6pt;
          }
          h1 {
            font-size: 20pt;
            text-align: center;
            margin-bottom: 4pt;
            font-weight: bold;
          }
          .tagline {
            text-align: center;
            font-size: 9.5pt;
            color: #4f46e5;
            font-weight: bold;
            margin-bottom: 12pt;
          }
          .header-info {
            text-align: center;
            margin-bottom: 16pt;
            color: #475569;
            font-size: 9.5pt;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
          }
          .header-info span {
            margin: 0 6px;
          }
          h2 {
            font-size: 12.5pt;
            color: #1e1b4b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 16pt;
            margin-bottom: 10pt;
            font-weight: bold;
          }
          p {
            margin: 0 0 6pt 0;
            text-align: justify;
          }
          .intro-box {
            background-color: #f8fafc;
            border-left: 4px solid #4f46e5;
            padding: 8px 12px;
            margin-bottom: 12pt;
            color: #334155;
            font-size: 10pt;
          }
          .skill-item {
            margin-bottom: 8pt;
          }
          .skill-name {
            font-weight: bold;
            color: #4f46e5;
          }
          .experience-header {
            font-weight: bold;
            margin-top: 10pt;
            margin-bottom: 4pt;
            font-size: 10.5pt;
          }
          .experience-company {
            color: #0f172a;
            font-size: 11pt;
          }
          .experience-role {
            color: #475569;
            font-weight: bold;
          }
          .experience-duration {
            font-weight: normal;
            color: #64748b;
            float: right;
          }
          .experience-highlight {
            background-color: #f1f5f9;
            color: #334155;
            padding: 5px 8px;
            margin-bottom: 6pt;
            font-size: 9.5pt;
            font-weight: 500;
          }
          .achievements-list {
            margin-top: 4pt;
            margin-bottom: 10pt;
            padding-left: 18px;
          }
          .achievements-list li {
            margin-bottom: 4pt;
            color: #334155;
          }
          .portfolio-title {
            font-weight: bold;
            font-size: 11pt;
            color: #0f172a;
            margin-bottom: 4pt;
          }
          .footer {
            margin-top: 40pt;
            font-size: 8.5pt;
            color: #94a3b8;
            text-align: center;
            border-top: 1px dashed #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>${editableResume.personalInfo.name}</h1>
        <div class="tagline">求职意向：${editableResume.personalInfo.jobTitle}</div>
        <div class="header-info">
          <span>电话：<b>${editableResume.personalInfo.phone}</b></span> | 
          <span>微信：<b>${editableResume.personalInfo.wechat}</b></span> | 
          <span>邮箱：<b>${editableResume.personalInfo.email}</b></span> | 
          <span>城市：<b>${editableResume.personalInfo.location || "待定"}</b></span>
        </div>
        
        <h2>01 / 个人转型自述 ( rational career transition )</h2>
        <div class="intro-box">
          ${editableResume.intro}
        </div>
        
        <h2>02 / 核心可迁移能力 ( core transferrable competencies )</h2>
        <div>
          ${editableResume.coreSkills.map((s: any) => `
            <div class="skill-item">
              <span class="skill-name">【${s.name}】</span>
              <span>${s.description}</span>
            </div>
          `).join('')}
        </div>
        
        <h2>03 / 重构工作经历 ( targeted experience re-alignment )</h2>
        <div>
          ${editableResume.workExperiences.map((w: any) => `
            <div style="margin-bottom: 14pt;">
              <div class="experience-header">
                <span class="experience-company">${w.company}</span>
                <span style="font-weight:normal; color:#cbd5e1; margin:0 8px;">|</span>
                <span class="experience-role">${w.role}</span>
                <span class="experience-duration">${w.duration}</span>
              </div>
              <div class="experience-highlight">
                <b style="color:#4f46e5;">🔄 跨界迁移亮点提炼：</b>${w.highlight}
              </div>
              <ul class="achievements-list">
                ${w.achievements.map((a: any) => `<li style="list-style-type:disc; margin-left:15px;">${a}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <h2>04 / 定向备战攻坚项目 ( simulated key operations case study )</h2>
        <div style="margin-bottom:12pt;">
          <div class="portfolio-title">【项目/模拟作品】${editableResume.portfolioProject.name}</div>
          <div style="margin-bottom:4pt; font-size:9.5pt; color:#475569;"><b>担当角色：</b>${editableResume.portfolioProject.role}</div>
          <div style="margin-bottom:6pt; text-align:justify;"><b>核心攻坚背景与主导思路：</b>${editableResume.portfolioProject.description}</div>
          <div style="margin-bottom:2pt; font-weight:bold; color:#475569; font-size:9.5pt;">📦 已输出的高精仿真交付作品：</div>
          <ul class="achievements-list">
            ${editableResume.portfolioProject.outputs.map((o: any) => `<li style="list-style-type:disc; margin-left:15px;">${o}</li>`).join('')}
          </ul>
        </div>

        <h2>05 / 教育背景 ( educational background )</h2>
        <div style="margin-bottom:12pt;">
          ${(editableResume.educationList || []).map((edu: any) => `
            <div style="margin-bottom: 6pt;">
              <div class="experience-header">
                <span class="experience-company">${edu.school}</span>
                <span style="font-weight:normal; color:#cbd5e1; margin:0 8px;">|</span>
                <span class="experience-role">${edu.major} (${edu.degree})</span>
                <span class="experience-duration">${edu.duration}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${showResumeFooter ? `
        <div class="footer">
          <span>${resumeFooterLeft}</span>
          <span style="margin: 0 15px;">|</span>
          <span>${resumeFooterRight}</span>
        </div>
        ` : ""}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#E2E8F0] selection:text-[#0F172A]">
      {/* Dynamic Title and Workspace Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EDF2F7] px-6 py-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-sm">
              <img src="/logo.jpeg" alt="BitQAI" className="h-9 w-auto" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              简历重构与跨行求职策略平台
                <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                  招聘方思维模拟版
                </span>
              </h1>
              <p className="text-xs text-[#64748B]">
                跨行业求职策略专家 + 招聘方风险评估 + 高匹配度场景化简历重构系统
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI 策略服务端就绪
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-slate-500">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>已注册：<strong className="text-slate-800 font-semibold">{authPhone}</strong></span>
                    <span>免费额度：<strong className="text-slate-800 font-semibold">{freeQuota !== null ? `${freeQuota} 次` : "..." }</strong></span>
                    <span>剩余额度：<strong className="text-slate-800 font-semibold">{paidQuota !== null ? `${paidQuota} 次` : "..." }</strong></span>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.removeItem("sessionToken");
                      setSessionToken("");
                      setIsLoggedIn(false);
                      setAuthPhone("");
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100"
                  >退出</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">未注册，请先完成手机号验证登记</span>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    注册 / 登录
                  </button>
                </div>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Inputs & Presets (no-print) */}
          <div className={`no-print transition-all duration-400 ${leftPanelCollapsed ? 'lg:col-span-1' : 'lg:col-span-5'} space-y-6 overflow-hidden`}>
            
            {/* 折叠/展开左侧面板的切换按钮 */}
            {result && (
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className={`w-full flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:bg-slate-50 transition-all group ${leftPanelCollapsed ? 'flex-col gap-2' : ''}`}
              >
                <span className="text-xs font-bold text-slate-600 flex items-center gap-2 whitespace-nowrap">
                  {leftPanelCollapsed ? (
                    <><ChevronRight className="h-4 w-4 text-indigo-500" /></>
                  ) : (
                    <><ChevronRight className="h-4 w-4 text-indigo-500 -rotate-180" /> 收起输入面板</>
                  )}
                </span>
                {leftPanelCollapsed && (
                  <span className="flex flex-col items-center gap-1 animate-pulse">
                    <span className="text-[10px] text-indigo-500 font-bold" style={{ writingMode: 'vertical-rl' }}>点击展开输入面板</span>
                  </span>
                )}
              </button>
            )}
            
            {/* 可折叠的左侧内容区 */}
            <div className={`space-y-6 transition-all duration-400 ${leftPanelCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-full'}`}>
            
            {/* Value Proposition Statement */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <Award className="h-4 w-4" />
                <span>求职策略底层原理</span>
              </div>
              <p className="text-xs leading-relaxed text-[#475569]">
                招聘方拒绝跨行投递的本质是 
                <strong className="text-slate-900 mx-0.5 font-bold">“高试错成本”</strong>。
                本系统通过重构高情商问询话术进行“自我成交”，制定 <strong>7天硬核实战</strong> 补齐能力，并以
                <strong>“行为+结果”场景化案例</strong> 重塑简历，一瞬间降低HR高风险判断。
              </p>
            </div>

            {/* Quick Demo Templates */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  快速体验高端跨行重组模板
                </span>
                <span className="text-[11px] text-[#475569] bg-slate-100 rounded-md px-2 py-0.5">
                  一键填入
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {demoExamples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadExample(i)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-100 bg-[#FAFAFB] hover:bg-white hover:border-indigo-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {ex.badge}
                      </span>
                      <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-xs font-medium text-slate-800 line-clamp-1 block">
                      {ex.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            </div>{/* 折叠区域结束（求职策略原理 + 快速体验模板） */}

            <AuthModal
              show={showAuthModal}
              authMode={authMode}
              authPhone={authPhone}
              authPassword={authPassword}
              authPasswordConfirm={authPasswordConfirm}
              authCode={authCode}
              authLoading={authLoading}
              authMessage={authMessage}
              onClose={() => { setShowAuthModal(false); setAuthMessage(null); }}
              onModeChange={setAuthMode}
              onPhoneChange={setAuthPhone}
              onPasswordChange={setAuthPassword}
              onPasswordConfirmChange={setAuthPasswordConfirm}
              onCodeChange={setAuthCode}
              onSendCode={handleSendCode}
              onVerifyCode={handleVerifyCode}
              onLogin={handleLogin}
            />

            <PaymentModal
              show={showPaymentModal}
              sessionToken={sessionToken}
              freeQuota={freeQuota}
              paymentCodeUrl={paymentCodeUrl}
              paymentOrderNo={paymentOrderNo}
              copiedQRCode={copiedQRCode}
              paymentStatusMessage={paymentStatusMessage}
              onClose={() => { setShowPaymentModal(false); setPaymentStatusMessage(null); }}
              onCheckPaymentStatus={handleCheckPaymentStatus}
              onCopyQRCode={() => { navigator.clipboard.writeText(paymentCodeUrl); setCopiedQRCode(true); setTimeout(() => setCopiedQRCode(false), 2000); }}
            />

            {/* Core Form */}
            <div className={`overflow-hidden transition-all duration-400 ${leftPanelCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-full opacity-100'}`}>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                <span>输入求职岗位与个人履历</span>
              </h2>

              <form onSubmit={handleGenerateStrategy} className="space-y-4">
                {/* Candidate Base Info Settings */}
                <div className="bg-indigo-50/55 p-4 rounded-xl border border-indigo-100/60 space-y-3 mb-2">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    👤 候选人姓名与联系方式 (支持随时修改)
                  </span>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="cand-name-input" className="block text-[10px] font-extrabold text-[#475569] mb-1">
                        姓名
                      </label>
                      <input
                        id="cand-name-input"
                        type="text"
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="李明"
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium text-slate-850"
                      />
                    </div>
                    <div>
                      <label htmlFor="cand-phone-input" className="block text-[10px] font-extrabold text-[#475569] mb-1">
                        联系电话 / 微信同号
                      </label>
                      <input
                        id="cand-phone-input"
                        type="text"
                        required
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        placeholder="13800000000"
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium text-slate-850"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Name */}
                <div>
                  <label htmlFor="job-name" className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                    <span>1. 目标岗位名称</span>
                    <span className="text-[10px] text-slate-400 font-normal">例如：初级门店主管 / 活动运营</span>
                  </label>
                  <input
                    id="job-name"
                    type="text"
                    required
                    value={targetJobName}
                    onChange={(e) => setTargetJobName(e.target.value)}
                    placeholder="输入您希望成功转行的目标岗位..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Job JD */}
                <div>
                  <label htmlFor="job-jd" className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                    <span>2. 目标岗位描述 (JD) 要求</span>
                    <span className="text-[10px] text-indigo-600 font-normal">粘贴JD可帮AI精准找痛点</span>
                  </label>
                  <textarea
                    id="job-jd"
                    required
                    rows={5}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="将招聘网站上的岗位职责、要求说明粘贴在这里，以便系统梳理招聘方的‘高危顾虑点’..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-y leading-relaxed font-sans"
                  />
                </div>

                {/* Candidate Background */}
                <div>
                  <label htmlFor="cand-bg" className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                    <span>3. 候选人自身情况 (经历 / 技巧 / 转型原因)</span>
                    <span className="text-[10px] text-indigo-600 font-normal">{candidateName}，可顺带写明您原本的行业</span>
                  </label>
                  <textarea
                    id="cand-bg"
                    required
                    rows={6}
                    value={candidateBackground}
                    onChange={(e) => setCandidateBackground(e.target.value)}
                    placeholder="例如：原大厂在线客服3年，善于高难度纠纷降级、带过新人，拥有客服质检意识；想转型咖啡店或零售主管，觉得客服技能完全可以平移..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-y leading-relaxed font-sans"
                  />
                  <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">💡 专家提示（招聘视角）：</p>
                    <p>不用追求简历看似跨度大。AI会将旧技能（如“多方协调、抗压、排班”）提炼重新描述，生成令人惊叹的新岗位强匹配资产。</p>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111827] hover:bg-slate-800 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                      <span>正在以招聘专家视角重组分析中 (约需1分钟)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>开启“降低风险”跨行求职包重构</span>
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}
            </div>
            </div>{/* 折叠区域结束（输入表单） */}
          </div>

          {/* Right Panel: Rendered Insights and Output (Interactive Tabs) */}
          <div className={`space-y-6 transition-all duration-400 ${leftPanelCollapsed ? 'lg:col-span-11' : 'lg:col-span-7'}`}>

            {!result && !loading && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200/90 p-12 text-center space-y-5 shadow-sm min-h-[500px] flex flex-col items-center justify-center">
                <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    等待重构跨行求职核心资产
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    在左侧选择 <span className="text-indigo-600 font-medium">“快速体验高端跨行重组模板”</span> 进行一键填充，或者手动填写目标岗招聘信息及您目前的岗位情况。
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full pt-4">
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-left">
                    <div className="font-bold text-xs text-slate-700 mb-1">💬 自我成交话术</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">三款不同语境，极富职场情商，绝非无用低价值提问。</p>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-left">
                    <div className="font-bold text-xs text-slate-700 mb-1">🛡️ 7天突击演练</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">明确漏洞指标、每天安排实战练习及有形象资料沉淀。</p>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-left">
                    <div className="font-bold text-xs text-slate-700 mb-1">📄 拟真高配简历</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">彻底改写死板的原经历，新增精美模拟项目让您变业内人。</p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm min-h-[500px] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                  <Sparkles className="h-6 w-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-sm font-bold text-slate-800">
                    正在扮演卓越招聘总监与职业包装专家
                  </h3>
                  <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
                    <p className="animate-pulse">✍️ 拆解JD常态化痛点与隐藏硬性需求...</p>
                    <p className="animate-pulse delay-200 text-[#475569]">⚡ 翻译并提炼核心可迁移技能，实现数据行为化重构...</p>
                    <p className="animate-pulse delay-500">🛡️ 模型组装定制仿真的求职利器级“模拟项目”大纲...</p>
                  </div>
                </div>
                <div className="w-48 bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-infinite-scroll"></div>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6">
                
                {/* Switcher Tab Header (no-print) */}
                <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm flex items-center justify-between no-print">
                  <nav className="flex space-x-1" aria-label="Tabs">
                    <button
                      onClick={() => setCurrentTab("scripts")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        currentTab === "scripts"
                          ? "bg-[#111827] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>① 投递前问询话术</span>
                    </button>
                    
                    <button
                      onClick={() => { setCurrentTab("strategy"); setUnseenTabs(prev => { const next = new Set(prev); next.delete("strategy"); return next; }); }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${
                        currentTab === "strategy"
                          ? "bg-[#111827] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>② 7天硬核备战</span>
                      {unseenTabs.has("strategy") && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>}
                      {unseenTabs.has("strategy") && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500"></span>}
                    </button>
                    
                    <button
                      onClick={() => { setCurrentTab("resume"); setUnseenTabs(prev => { const next = new Set(prev); next.delete("resume"); return next; }); }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${
                        currentTab === "resume"
                          ? "bg-[#111827] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>③ 定制简历预检</span>
                      {unseenTabs.has("resume") && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>}
                      {unseenTabs.has("resume") && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500"></span>}
                    </button>
                  </nav>

                  {/* Right side download action fast access */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={pdfGenerating}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {pdfGenerating ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>{pdfGenerating ? "正在转码..." : "下载 PDF"}</span>
                    </button>
                    <button
                      onClick={handlePrintPDF}
                      className="border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="通过浏览器保存或打印（备用）"
                    >
                      <span>打印/另存</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Inquiry Scripts */}
                {currentTab === "scripts" && (
                  <div className="space-y-6 no-print">
                    <div className="bg-[#111827] text-white rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 transform translate-x-10 -translate-y-10 opacity-10">
                        <Smartphone className="h-40 w-40 text-white" />
                      </div>
                      <div className="relative space-y-2">
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          成交导向的私信话术
                        </span>
                        <h3 className="text-base font-bold">高情商投递前沟通话术</h3>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                          严禁问“收不收转行的”或做低价值提问。以下3种话术旨在顺带表达对行业的认知、亮明不可替代的可迁移核心优势、表明降低试错成本的主动态度。
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Robust style */}
                      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 relative group hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            <h4 className="text-xs font-bold text-slate-700">【风格 ①】传统行业稳重型</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            字数：{(result?.inquiryScripts?.steady || "").length}字 (80-120最佳)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed border border-slate-100 font-serif">
                          “{result?.inquiryScripts?.steady || ""}”
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[#475569]">
                            🎯 适合岗位：传统、稳重规范的重资产行业，更偏逻辑与持久承载力
                          </span>
                          <button
                            onClick={() => handleCopyToClipboard(result?.inquiryScripts?.steady || "", "steady")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1 px-2.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedIndex === "steady" ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>复制此话术</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Active style */}
                      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 relative group hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <h4 className="text-xs font-bold text-slate-700">【风格 ②】服务/销售主动进攻型</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            字数：{(result?.inquiryScripts?.active || "").length}字 (80-120最佳)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed border border-slate-100 font-serif">
                          “{result?.inquiryScripts?.active || ""}”
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[#475569]">
                            🎯 适合岗位：对绩效成长、执行节奏、销售扩张要求极其饥渴的业态
                          </span>
                          <button
                            onClick={() => handleCopyToClipboard(result?.inquiryScripts?.active || "", "active")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1 px-2.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedIndex === "active" ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>复制此话术</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Casual style */}
                      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 relative group hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                            <h4 className="text-xs font-bold text-slate-700">【风格 ③】店面基础轻沟通型</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            字数：{(result?.inquiryScripts?.casual || "").length}字 (80-120最佳)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed border border-slate-100 font-serif">
                          “{result?.inquiryScripts?.casual || ""}”
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[#475569]">
                            🎯 适合岗位：餐饮门店茶饮店兼兼职、高流转初级岗位，快速决策
                          </span>
                          <button
                            onClick={() => handleCopyToClipboard(result?.inquiryScripts?.casual || "", "casual")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1 px-2.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedIndex === "casual" ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>复制此话术</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Preparation Strategy */}
                {currentTab === "strategy" && (
                  <div className="space-y-6 no-print">
                    
                    {/* Core Gaps */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                          招聘方视角的真实能力漏洞 (极其直接，不要客气)
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                        {(result?.prepStrategy?.skillsGap || []).map((gap, index) => (
                          <div key={index} className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5">
                            <span className="bg-rose-100 text-rose-800 text-xs font-bold rounded-lg h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-800">
                                {gap.split("：")[0] || "痛点发现"}
                              </p>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {gap.split("：")[1] || gap}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 7-Day Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Calendar className="text-indigo-600 h-4 w-4" />
                        <h4 className="text-xs font-bold text-slate-800">连锁岗位“7天超高压硬核行军备战方案”</h4>
                      </div>
                      
                      <div className="relative border-l-2 border-slate-100 pl-5 space-y-6 ml-3">
                        {(result?.prepStrategy?.sevenDayPlan || []).map((plan, index) => (
                          <div key={index} className="relative group">
                            {/* Dot */}
                            <span className="absolute -left-[29px] top-1.5 bg-indigo-600 text-white font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white box-content shadow-sm group-hover:scale-110 transition-transform">
                              {plan.day}
                            </span>
                            
                            <div className="space-y-2 bg-[#FAFAFB] group-hover:bg-white border border-slate-100 group-hover:border-slate-200 rounded-xl p-4 transition-all">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#111827]">
                                  第 {plan.day} 天：{plan.focus}
                                </span>
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded">
                                  行军计划
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] border-t border-dashed border-slate-100">
                                <div>
                                  <span className="font-semibold text-slate-700 block mb-0.5">📚 硬核知识注入:</span>
                                  <p className="text-slate-600 leading-relaxed">{plan.learn}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-700 block mb-0.5">⚡ 模拟实操练手:</span>
                                  <p className="text-slate-600 leading-relaxed">{plan.practice}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-indigo-600 block mb-0.5">📦 有形交付产出:</span>
                                  <p className="text-[#334155] leading-relaxed font-medium bg-indigo-50/25 p-1 rounded border border-indigo-100/50">{plan.output}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Critical Portfolio Materials */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <BookOpen className="text-indigo-600 h-4 w-4" />
                        <h4 className="text-xs font-bold text-slate-800">
                          面试敲门砖：必须自备的“仿真证明材料”大纲
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {(result?.prepStrategy?.portfolioMaterials || []).map((mat, i) => (
                          <div key={i} className="border border-slate-100 rounded-2xl bg-[#FAFAFB] p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/50 pb-2">
                              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                {mat.type}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                能力证明书
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="font-semibold text-slate-700 block mb-1">🎯 痛点对焦：</span>
                                <p className="text-slate-600 text-[11px] leading-relaxed">{mat.description}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-indigo-600 block mb-1">💡 额外证明了你具备：</span>
                                <p className="text-slate-600 text-[11px] leading-relaxed">{mat.value}</p>
                              </div>
                            </div>

                            <div className="bg-white border border-slate-100 p-3 rounded-xl space-y-2">
                              <span className="text-[10px] font-bold text-[#1F2937] uppercase tracking-wider block">
                                🛠️ 【参考范本大纲 / 指导细节】
                              </span>
                              <pre className="text-[11px] text-[#475569] leading-relaxed whitespace-pre-wrap font-mono bg-slate-50/50 p-2.5 rounded border border-slate-100">
                                {mat.templateExample}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Restructured Resume Profile (No-print controls + Print-area) */}
                {currentTab === "resume" && editableResume && (
                  <div className="space-y-6 animate-fadeIn pb-12">
                    {/* Inline Tips (no-print) */}
                    <div className="bg-[#EEF2F6] border border-[#CBD5E1] p-5 rounded-2xl flex items-start gap-4 no-print shadow-xs">
                      <Bookmark className="h-6 w-6 text-[#475569] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>✨ 智能在线高分工作台 (已开启实时在线修改)</span>
                          <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">LIVE-EDITABLE</span>
                        </h4>
                        <p className="text-xs text-[#475569] leading-relaxed">
                          对模型自动重构的表达不满意？<strong>无需导出，您可直接在下方简历区域中直接点击并编辑任意文字</strong>！可实时重命名、增删履历、润色话术。
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleDownloadPDF}
                            disabled={pdfGenerating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {pdfGenerating ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            <span>{pdfGenerating ? "正在生成极清PDF..." : "点击下载 PDF 简历"}</span>
                          </button>

                          <button
                            onClick={handleDownloadWord}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>下载 Word 简历 (.doc)</span>
                          </button>

                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`font-bold text-xs py-1.5 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all border ${
                              isEditing 
                                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse" 
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                            }`}
                            title="开启完美排版页面，隐藏所有编辑框和辅助线"
                          >
                            <span>{isEditing ? "👁️ 完满版面预览" : "✏️ 开启在线修改"}</span>
                          </button>
                          
                          <button
                            onClick={handlePrintPDF}
                            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="适合喜欢高精度缩放排版打印的用户，在 iframe 中如无反应可点击右上角新窗口运行本网页"
                          >
                            <span>备用：浏览器排版与另存</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RENDERED RESUME DOCUMENT (Ready for elegant browser saving/printing) */}
                    <div 
                      id="resume-print-area" 
                      className="bg-white rounded-3xl border border-slate-200 px-8 py-10 md:px-12 md:py-14 shadow-md max-w-[210mm] mx-auto text-slate-800 font-sans leading-relaxed tracking-normal transition-all"
                    >
                      {/* Personal Info Header */}
                      <header className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                          <div className="flex items-center gap-3">
                            {pdfGenerating || !isEditing ? (
                              <span className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight block px-1 py-0.5">
                                {editableResume.personalInfo.name || "姓名"}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editableResume.personalInfo.name}
                                onChange={(e) => updatePersonalInfo("name", e.target.value)}
                                className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight bg-transparent hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors max-w-[220px] rounded px-1 py-0.5"
                                placeholder="姓名"
                                title="点击编辑姓名"
                              />
                            )}
                            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded border border-slate-200 mt-1 uppercase">
                              转型实干者
                            </span>
                          </div>
                          
                          <div className="text-[#4F46E5] font-bold text-base mt-2 flex items-center gap-1 bg-indigo-50/50 border border-indigo-100/40 px-3 py-1 rounded-lg w-max shadow-3xs">
                            <Briefcase className="h-[15px] w-[15px] shrink-0 text-[#4F46E5]" />
                            <span className="text-xs text-[#4F46E5] font-semibold mr-1">意向岗位：</span>
                            {pdfGenerating || !isEditing ? (
                              <span className="font-bold text-[#4F46E5] text-sm px-1">
                                {editableResume.personalInfo.jobTitle || "意向岗位"}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editableResume.personalInfo.jobTitle}
                                onChange={(e) => updatePersonalInfo("jobTitle", e.target.value)}
                                className="bg-transparent font-bold text-[#4F46E5] hover:bg-white focus:bg-white border-b border-dashed border-transparent hover:border-indigo-300 focus:border-indigo-500 focus:outline-none transition-all text-sm px-1 rounded"
                                placeholder="意向岗位"
                                title="点击编辑意向岗位"
                              />
                            )}
                          </div>
                        </div>

                        {/* Contacts Panel */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 font-mono">
                          <span className="flex items-center gap-1 justify-end">
                            <Smartphone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {pdfGenerating || !isEditing ? (
                              <span className="text-xs font-mono text-slate-600 px-0.5">
                                {editableResume.personalInfo.phone}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editableResume.personalInfo.phone}
                                onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                                className="bg-transparent text-right hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono max-w-[125px] rounded px-0.5"
                                title="点击编辑联系电话"
                              />
                            )}
                          </span>
                          <span className="flex items-center gap-1 justify-end font-sans">
                            <span className="text-slate-400 text-xs shrink-0 font-mono">微信:</span>
                            {pdfGenerating || !isEditing ? (
                              <span className="text-xs font-mono text-slate-600 px-0.5">
                                {editableResume.personalInfo.wechat}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editableResume.personalInfo.wechat}
                                onChange={(e) => updatePersonalInfo("wechat", e.target.value)}
                                className="bg-transparent text-right hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono max-w-[125px] rounded px-0.5"
                                title="点击编辑微信号码"
                              />
                            )}
                          </span>
                          <span className="flex items-center gap-1 justify-end">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {pdfGenerating || !isEditing ? (
                              <span className="text-xs font-mono text-slate-600 px-0.5">
                                {editableResume.personalInfo.email}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editableResume.personalInfo.email}
                                onChange={(e) => updatePersonalInfo("email", e.target.value)}
                                className="bg-transparent text-right hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono max-w-[150px] rounded px-0.5"
                                title="点击编辑邮箱"
                              />
                            )}
                          </span>
                          <span className="flex items-center gap-1 justify-end font-sans">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {pdfGenerating || !isEditing ? (
                              <span className="text-xs font-mono text-slate-600 px-0.5">
                                {editableResume.personalInfo.location || "待定城市"}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editableResume.personalInfo.location}
                                onChange={(e) => updatePersonalInfo("location", e.target.value)}
                                className="bg-transparent text-right hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono max-w-[125px] rounded px-0.5"
                                title="点击编辑所在城市"
                              />
                            )}
                          </span>
                        </div>
                      </header>

                      {/* Personal Statement / Rational Career Shift Explanation */}
                      <section className="mt-8 space-y-2 resume-section">
                        <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-2">
                          <span>01 / 个人转型自述 ( rational career transition )</span>
                          <span className="h-[1px] bg-slate-200 flex-1"></span>
                        </h4>
                        <div className="bg-[#FAFAFB] border-l-4 border-slate-900 p-2 rounded-r-xl">
                          {pdfGenerating || !isEditing ? (
                            <p className="text-xs leading-relaxed text-[#374151] whitespace-pre-wrap p-2 font-sans font-medium">
                              {editableResume.intro}
                            </p>
                          ) : (
                            <textarea
                              value={editableResume.intro}
                              onChange={(e) => updateIntro(e.target.value)}
                              rows={3}
                              className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-2 focus:outline-none transition-all font-sans text-xs leading-relaxed text-[#374151] resize-y"
                              placeholder="请描述您的转型合理化、降险、并强关联新岗位的自述亮点..."
                              title="在线修改个人转型自述"
                            />
                          )}
                        </div>
                      </section>

                      {/* Transferrable Core Competencies */}
                      <section className="mt-8 space-y-3 resume-section">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-2 flex-1">
                            <span>02 / 核心可迁移能力 ( core transferrable competencies )</span>
                            <span className="h-[1px] bg-slate-200 flex-1"></span>
                          </h4>
                          <button
                            onClick={addCoreSkill}
                            className="ml-2 bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 transition-colors cursor-pointer no-print"
                          >
                            + 新增能力域
                          </button>
                        </div>
                        <div className={`grid gap-4 ${pdfGenerating ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                          {editableResume.coreSkills.map((domain, index) => (
                            <div key={index} className="relative border border-slate-100 rounded-xl p-3 bg-[#FAF8FF]/30 hover:bg-[#FAF8FF]/60 hover:border-slate-200 transition-all group/skill">
                              <button
                                onClick={() => removeCoreSkill(index)}
                                className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 text-[10px] opacity-0 group-hover/skill:opacity-100 transition-opacity no-print font-bold cursor-pointer"
                              >
                                删除
                              </button>
                              <div className="flex items-center gap-1.5 font-bold text-[#4B5563] text-xs border-b border-indigo-100/60 pb-1.5 mb-2">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                {pdfGenerating || !isEditing ? (
                                  <span className="text-[#374151] font-extrabold text-xs px-1">
                                    {domain.name}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={domain.name}
                                    onChange={(e) => updateCoreSkill(index, "name", e.target.value)}
                                    className="bg-transparent text-[#374151] font-extrabold focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors w-full px-1 rounded text-xs"
                                    placeholder="能力域 / 例如: 敏捷迭代开发、跨团队协同"
                                  />
                                )}
                              </div>
                              <div className="space-y-1">
                                {pdfGenerating || !isEditing ? (
                                  <p className="text-[#4B5563] font-medium leading-relaxed px-1 text-[11px] whitespace-pre-wrap">
                                    {domain.description}
                                  </p>
                                ) : (
                                  <textarea
                                    value={domain.description}
                                    onChange={(e) => updateCoreSkill(index, "description", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent text-[#4B5563] hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-[#4F46E5] focus:outline-none transition-colors px-1 rounded text-[11px] font-medium resize-y"
                                    placeholder="说明具体能力成熟度和行业平移价值"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Targeted Experience / Work Experience */}
                      <section className="mt-8 space-y-3 resume-section border-t-2 border-dashed border-slate-200 pt-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-2 flex-1">
                             <span>03 / 针对性业内工作实战 ( targeted job connection & targeted achievements )</span>
                             <span className="h-[1px] bg-slate-200 flex-1"></span>
                          </h4>
                          <button
                            onClick={addWorkExperience}
                            className="ml-2 bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 transition-colors cursor-pointer no-print"
                          >
                            + 新增业内工作实战
                          </button>
                        </div>

                        <div className="space-y-6">
                          {editableResume.workExperiences.map((xp, index) => (
                            <div key={index} className="space-y-3 border-b border-slate-100 pb-5 last:border-0 last:pb-0 relative group/xp">
                              {!pdfGenerating && isEditing && (
                                <button
                                  onClick={() => removeWorkExperience(index)}
                                  className="absolute right-2 -top-1 text-rose-500 hover:text-rose-700 text-[10px] font-bold no-print cursor-pointer border-0 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded transition-all shadow-3xs"
                                >
                                  删除整段履历
                                </button>
                              )}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                {pdfGenerating || !isEditing ? (
                                  <span className="text-sm font-black text-slate-900 px-1">
                                    {xp.company}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={xp.company}
                                    onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                                    className="text-xs font-black text-slate-900 text-sm bg-transparent hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all px-1 rounded max-w-[180px]"
                                    placeholder="公司名称"
                                  />
                                )}
                                <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500 font-mono">
                                  {pdfGenerating || !isEditing ? (
                                    <span className="font-medium px-1 text-xs text-slate-600 block">
                                      {xp.role}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={xp.role}
                                      onChange={(e) => updateWorkExperience(index, "role", e.target.value)}
                                      className="bg-transparent font-medium hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all px-1 text-xs text-slate-600 max-w-[130px] rounded"
                                      placeholder="岗位角色"
                                    />
                                  )}
                                  <span className="text-slate-300">|</span>
                                  {pdfGenerating || !isEditing ? (
                                    <span className="font-medium px-1 text-xs text-slate-600 block">
                                      {xp.duration}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={xp.duration}
                                      onChange={(e) => updateWorkExperience(index, "duration", e.target.value)}
                                      className="bg-transparent font-medium hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all px-1 text-xs text-slate-600 max-w-[140px] rounded"
                                      placeholder="在职时间"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Highlight box */}
                              <div className="bg-[#FAFAFB] px-3.5 py-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-medium">
                                <span className="text-indigo-600 font-bold block mb-0.5 uppercase tracking-wide">
                                  🔄 跨界迁移亮点提炼 / Rational Connection:
                                </span>
                                {pdfGenerating || !isEditing ? (
                                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap p-1 font-sans">
                                    {xp.highlight}
                                  </p>
                                ) : (
                                  <textarea
                                    value={xp.highlight}
                                    onChange={(e) => updateWorkExperience(index, "highlight", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-1 text-[11px] text-slate-600 font-medium leading-relaxed resize-y focus:outline-none transition-all font-sans"
                                    placeholder="阐述在这个岗位上沉淀的可立刻平移到目标岗的王牌属性..."
                                  />
                                )}
                              </div>

                              {/* Action details with STAR structure */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between no-print mb-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">📊 模块化真实匹配经历清单 (支持单独删加)</span>
                                  <button
                                    onClick={() => addAchievement(index)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100 transition-colors cursor-pointer"
                                  >
                                    + 新增成果描述
                                  </button>
                                </div>
                                <ul className="list-disc list-outside pl-4 space-y-1.5 text-xs text-[#374151]">
                                  {xp.achievements.map((ach, ai) => (
                                    <li key={ai} className="leading-relaxed relative pr-12 group/ach border-b border-[#F8FAFC] pb-1 hover:border-slate-100">
                                      {pdfGenerating || !isEditing ? (
                                        <span className="text-xs text-[#374151] font-normal block leading-relaxed py-0.5 whitespace-pre-wrap">
                                          {ach}
                                        </span>
                                      ) : (
                                        <input
                                          type="text"
                                          value={ach}
                                          onChange={(e) => updateAchievement(index, ai, e.target.value)}
                                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors text-xs text-[#374151] font-normal"
                                          placeholder="利用 STAR 框架补充您的实操方案、量化细节，字数约 30-70"
                                        />
                                      )}
                                      <button
                                        onClick={() => removeAchievement(index, ai)}
                                        className="absolute right-0 top-0.5 text-rose-500 hover:text-rose-700 text-[10px] transition-all hover:underline no-print flex items-center gap-0.5 cursor-pointer font-bold"
                                        title="删除此项成果"
                                      >
                                        删除
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Specialized Heavyweight Project/Assignment Blueprint */}
                      <section className="mt-8 space-y-3 resume-section border-t-2 border-dashed border-slate-200 pt-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-2 flex-1">
                            <span>04 / 定向备战攻坚项目 ( simulated key operations case study )</span>
                            <span className="h-[1px] bg-slate-200 flex-1"></span>
                          </h4>
                        </div>
                        <div className="border border-slate-200 rounded-2xl p-4 md:p-5 bg-slate-50/50 space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-1.5 w-full">
                              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                              {pdfGenerating || !isEditing ? (
                                <span className="font-black text-slate-900 text-[13px] px-1 py-0.5">
                                  {editableResume.portfolioProject.name}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={editableResume.portfolioProject.name}
                                  onChange={(e) => updatePortfolioProject("name", e.target.value)}
                                  className="bg-transparent font-black text-slate-900 text-[13px] hover:bg-slate-100 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors w-full px-1 py-0.5 rounded"
                                  placeholder="攻坚项目/实操成果名称"
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-[#4B5563] bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-3xs shrink-0">
                              <span>角色:</span>
                              {pdfGenerating || !isEditing ? (
                                <span className="font-bold px-1 text-[10px] text-[#4B5563]">
                                  {editableResume.portfolioProject.role}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={editableResume.portfolioProject.role}
                                  onChange={(e) => updatePortfolioProject("role", e.target.value)}
                                  className="bg-transparent font-bold hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors max-w-[100px] px-1 text-[10px] rounded text-[#4B5563]"
                                  placeholder="角色"
                                />
                              )}
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="font-extrabold text-[#111827] block mb-1">🎯 核心攻坚背景与主导思路：</span>
                            {pdfGenerating || !isEditing ? (
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap p-1 font-sans">
                                {editableResume.portfolioProject.description}
                              </p>
                            ) : (
                              <textarea
                                value={editableResume.portfolioProject.description}
                                onChange={(e) => updatePortfolioProject("description", e.target.value)}
                                rows={2}
                                className="w-full bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-1 text-xs text-slate-600 leading-relaxed resize-y focus:outline-none transition-all font-sans"
                                placeholder="说明在这个拟真的业内项目里，您是如何主导方案、应对日常困难和解决核心痛点的..."
                              />
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between no-print mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                📦 已输出的高精仿真交付作品(体现您对实干流程极为纯熟)：
                              </span>
                              <button
                                onClick={addProjectOutput}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100 transition-colors cursor-pointer"
                              >
                                + 新增成果交付
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {editableResume.portfolioProject.outputs.map((out, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between gap-2">
                                  <div className="flex items-start gap-1.5 w-full">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse"></span>
                                    {pdfGenerating || !isEditing ? (
                                      <span className="text-xs text-[#374151] font-mono leading-relaxed py-0.5 block">
                                        {out}
                                      </span>
                                    ) : (
                                      <input
                                        type="text"
                                        value={out}
                                        onChange={(e) => updateProjectOutput(idx, e.target.value)}
                                        className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border-b border-dashed border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors text-xs text-[#374151] font-mono leading-relaxed"
                                        placeholder="交付作品集文件"
                                      />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeProjectOutput(idx)}
                                    className="text-rose-500 hover:text-rose-700 text-[9px] font-bold hover:underline shrink-0 no-print cursor-pointer"
                                    title="删除此交付作"
                                  >
                                    删除
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Educational Background Section */}
                      <section className="mt-8 space-y-3 resume-section border-t-2 border-dashed border-slate-200 pt-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-2 flex-1">
                            <span>05 / 教育背景 ( educational background )</span>
                            <span className="h-[1px] bg-slate-200 flex-1"></span>
                          </h4>
                          {!pdfGenerating && isEditing && (
                            <button
                              onClick={addEducation}
                              className="ml-2 bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 transition-colors cursor-pointer no-print whitespace-nowrap"
                            >
                              + 新增教育背景
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {(!editableResume.educationList || editableResume.educationList.length === 0) ? (
                            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                              暂无教育背景。点击上方“+ 新增教育背景”按钮即可在此区域添加。
                            </div>
                          ) : (
                            editableResume.educationList.map((edu, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50/50 transition-all relative group/edu">
                                {!pdfGenerating && isEditing && (
                                  <button
                                    onClick={() => removeEducation(idx)}
                                    className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 text-[9px] font-bold no-print cursor-pointer border-0 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded transition-all opacity-0 group-hover/edu:opacity-100"
                                  >
                                    删除该条
                                  </button>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  {pdfGenerating || !isEditing ? (
                                    <span className="text-xs font-black text-slate-800 px-1">
                                      {edu.school}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={edu.school}
                                      onChange={(e) => updateEducation(idx, "school", e.target.value)}
                                      className="text-xs font-black text-slate-800 bg-transparent hover:bg-white focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all px-1 rounded py-0.5 min-w-[150px]"
                                      placeholder="学校名称（如南京工商大学）"
                                    />
                                  )}
                                  <span className="text-slate-300 hidden sm:inline">|</span>
                                  {pdfGenerating || !isEditing ? (
                                    <span className="text-xs font-medium text-slate-600 px-1">
                                      {edu.major} ({edu.degree})
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={edu.major}
                                        onChange={(e) => updateEducation(idx, "major", e.target.value)}
                                        className="text-xs font-medium text-slate-600 bg-transparent hover:bg-white focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all px-1 rounded py-0.5 max-w-[120px]"
                                        placeholder="主修专业"
                                      />
                                      <span className="text-slate-400 text-[10px] sm:text-xs">(</span>
                                      <input
                                        type="text"
                                        value={edu.degree}
                                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                        className="text-xs font-medium text-slate-600 bg-transparent hover:bg-white focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all px-1 rounded py-0.5 max-w-[70px]"
                                        placeholder="学位"
                                      />
                                      <span className="text-slate-400 text-[10px] sm:text-xs">)</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 font-mono text-[11px] text-[#4B5563] shrink-0 sm:text-right">
                                  {pdfGenerating || !isEditing ? (
                                    <span className="px-1 text-slate-500 font-medium">
                                      {edu.duration}
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={edu.duration}
                                      onChange={(e) => updateEducation(idx, "duration", e.target.value)}
                                      className="text-[11px] font-mono text-slate-500 bg-transparent hover:bg-white focus:bg-white border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-all text-left sm:text-right px-1 rounded py-0.5 max-w-[130px]"
                                      placeholder="在校起止时间"
                                    />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                      {/* CV Footer */}
                      {showResumeFooter ? (
                        <footer className="mt-12 pt-4 border-t border-slate-200/65 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2.5 font-mono relative group/footer">
                          {!pdfGenerating && isEditing && (
                            <button
                              onClick={() => setShowResumeFooter(false)}
                              className="absolute -top-3.5 right-0 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-100 no-print transition-all cursor-pointer flex items-center gap-1"
                              title="完全删除页脚"
                            >
                              <Trash2 className="h-3 w-3" /> 完全删除页脚
                            </button>
                          )}
                          {pdfGenerating || !isEditing ? (
                            <span>{resumeFooterLeft}</span>
                          ) : (
                            <input
                              type="text"
                              value={resumeFooterLeft}
                              onChange={(e) => setResumeFooterLeft(e.target.value)}
                              className="bg-transparent hover:bg-slate-50 border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all px-1 py-0.5 rounded text-left text-slate-400 w-full sm:w-1/2"
                              placeholder="页脚左侧内容..."
                            />
                          )}
                          {pdfGenerating || !isEditing ? (
                            <span>{resumeFooterRight}</span>
                          ) : (
                            <input
                              type="text"
                              value={resumeFooterRight}
                              onChange={(e) => setResumeFooterRight(e.target.value)}
                              className="bg-transparent hover:bg-slate-50 border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all px-1 py-0.5 rounded text-left sm:text-right text-slate-400 w-full sm:w-1/2"
                              placeholder="页脚右侧内容..."
                            />
                          )}
                        </footer>
                      ) : (
                        !pdfGenerating && isEditing && (
                          <div className="mt-12 p-3 bg-indigo-50/40 rounded-xl border border-dashed border-indigo-200 flex items-center justify-between no-print animate-fade-in">
                            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                              📄 简历页脚信息已被完全移除（打印及PDF文件将不再带有本行声明）。
                            </span>
                            <button
                              onClick={() => setShowResumeFooter(true)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-3xs cursor-pointer transition-all hover:scale-102"
                            >
                              + 恢复声明页脚
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer (no-print) */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-6 px-6 text-center text-xs text-slate-500 space-y-1 z-30 relative no-print">
        <p className="font-semibold text-slate-700">{candidateName}专属跨行高分简历与备战工作台</p>
        <p>让招聘方在第一眼就降低风险判断，建立强迁移联结。祝求职成功！</p>
      </footer>
      <WeChatWidget />
    </div>
  );
}
