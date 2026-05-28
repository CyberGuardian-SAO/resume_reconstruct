/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 用户注册/登录弹窗组件
 */

import React from "react";
import { X, Smartphone, Lock, AlertCircle } from "lucide-react";

interface AuthModalProps {
  show: boolean;
  authMode: "register" | "login";
  authPhone: string;
  authPassword: string;
  authPasswordConfirm: string;
  authCode: string;
  authLoading: boolean;
  authMessage: string | null;
  onClose: () => void;
  onModeChange: (mode: "register" | "login") => void;
  onPhoneChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onPasswordConfirmChange: (val: string) => void;
  onCodeChange: (val: string) => void;
  onSendCode: () => void;
  onVerifyCode: () => void;
  onLogin: () => void;
}

export default function AuthModal({
  show, authMode, authPhone, authPassword, authPasswordConfirm, authCode,
  authLoading, authMessage,
  onClose, onModeChange, onPhoneChange, onPasswordChange,
  onPasswordConfirmChange, onCodeChange, onSendCode, onVerifyCode, onLogin,
}: AuthModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">手机号注册 / 登录</h2>
            <p className="text-[11px] text-slate-500 mt-1">仅首次验证赠送1次免费额度，登录时只需手机号和密码。</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-2 items-center">
          <button onClick={() => onModeChange("register")}
            className={`py-2 rounded-xl text-sm font-bold ${authMode === "register" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            注册
          </button>
          <button onClick={() => onModeChange("login")}
            className={`py-2 rounded-xl text-sm font-bold ${authMode === "login" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            登录
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input type="text" value={authPhone} onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="请输入您的手机号"
                className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">设置密码</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input type="password" value={authPassword} onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="请输入至少6位密码"
                className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
          </div>

          {authMode === "register" && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">再次输入密码</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input type="password" value={authPasswordConfirm} onChange={(e) => onPasswordConfirmChange(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              </div>
            </div>
          )}

          {authMode === "register" && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">短信验证码</label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input type="text" value={authCode} onChange={(e) => onCodeChange(e.target.value)}
                  placeholder="输入验证码"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                <button onClick={onSendCode} disabled={authLoading}
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-5 py-3 rounded-xl border border-indigo-100 transition-all disabled:opacity-50 active:scale-95">
                  获取验证码
                </button>
              </div>
            </div>
          )}

          <button onClick={authMode === "register" ? onVerifyCode : onLogin} disabled={authLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-2">
            {authLoading ? "处理中..." : authMode === "register" ? "完成验证登记" : "直接登录"}
          </button>

          {authMessage && (
            <div className="rounded-xl bg-indigo-50/80 border border-indigo-100 p-3.5 flex gap-2.5 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-indigo-700 font-medium">{authMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
