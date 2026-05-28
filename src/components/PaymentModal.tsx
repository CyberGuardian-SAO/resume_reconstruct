/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 微信支付弹窗组件
 */

import React from "react";
import { X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  show: boolean;
  sessionToken: string;
  freeQuota: number | null;
  paymentCodeUrl: string;
  paymentOrderNo: string;
  copiedQRCode: boolean;
  paymentStatusMessage: string | null;
  onClose: () => void;
  onCheckPaymentStatus: () => void;
  onCopyQRCode: () => void;
}

export default function PaymentModal({
  show, sessionToken, freeQuota, paymentCodeUrl, paymentOrderNo,
  copiedQRCode, paymentStatusMessage,
  onClose, onCheckPaymentStatus, onCopyQRCode,
}: PaymentModalProps) {
  if (!show || !sessionToken || freeQuota !== 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/WeChat.svg" alt="微信支付" className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">微信扫描支付</h2>
              <p className="text-[11px] text-slate-500 mt-1">免费额度已用完，请扫码支付以继续</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!paymentCodeUrl ? (
          <div className="py-6 space-y-6 text-center">
            <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800">正在创建订单...</h3>
              <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">请稍候，正在为您生成微信支付订单</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-inner relative flex items-center justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentCodeUrl)}`}
                  alt="微信支付二维码" className="w-full h-full object-contain" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">等待支付中</span>
                </div>
              </div>
              <div className="space-y-2">
                <button onClick={onCopyQRCode}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 py-2.5 rounded-xl border border-amber-200 transition-all active:scale-95">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {copiedQRCode ? "已复制到剪贴板" : "可保存二维码图片到微信扫一扫支付"}
                </button>
                <p className="text-[9px] text-slate-500 text-center leading-relaxed">若无法用微信直接扫描，请复制二维码链接到微信浏览器打开</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>订单已生成</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">订单编号</span>
                    <span className="text-xs text-slate-900 font-mono font-bold break-all max-w-[180px] text-right">{paymentOrderNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">支付金额</span>
                    <span className="text-2xl text-slate-900 font-black">¥ 1.00</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">请使用微信扫一扫完成支付。支付成功后，系统将自动识别并解锁 AI 生成功能。</p>

              <div className="pt-2 space-y-2">
                <button onClick={onCheckPaymentStatus}
                  className="w-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-3 rounded-xl border border-indigo-100 transition-all active:scale-95">
                  已支付？手动刷新状态
                </button>
              </div>
            </div>
          </div>
        )}

        {paymentStatusMessage && (
          <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-4 flex gap-3 animate-in fade-in duration-500">
            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800 font-medium italic">{paymentStatusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
