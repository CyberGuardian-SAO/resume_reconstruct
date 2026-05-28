import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, QrCode, Phone } from 'lucide-react';

export function WeChatWidget() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed right-6 bottom-6 z-50 flex items-end justify-end group"
        >
          {/* Close button - appears on hover */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-white text-gray-500 hover:text-gray-900 shadow-md border border-gray-100 rounded-full flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
            aria-label="Close"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Main Floating Button */}
          <div className="relative w-12 h-12 bg-gradient-to-br from-[#07C160] to-[#06ad56] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#07C160]/30 hover:scale-110 transition-transform cursor-pointer">
            <MessageCircle className="w-6 h-6" />
            
            {/* Ping animation behind */}
            <div className="absolute inset-0 rounded-full border border-[#07C160] animate-ping opacity-20 pointer-events-none" />
          </div>

          {/* Floating pop-out content on hover (simulated QR code panel) */}
          <div className="absolute right-full bottom-0 mb-0 mr-4 w-48 bg-white shadow-2xl rounded-[2rem] p-6 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-bottom-right translate-x-4 group-hover:translate-x-0">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#07C160]/10 rounded-full flex items-center justify-center text-[#07C160] mb-3">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-800 tracking-tight mb-1 text-sm">欢迎扫码咨询</h4>
              <div className="w-full aspect-square bg-[#f8f9fa] rounded-xl border border-gray-100 p-2 mb-4">
                <div className="w-full h-full border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                  <img
                    src="/wechat-qrcode.jpg"
                    alt="微信二维码"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
                {/* <div className="flex items-center justify-center text-center">
                  <div className="w-8 h-8 bg-[#07C160]/10 rounded-full flex items-center justify-center text-[#07C160] mr-2">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[16px] text-gray-500 leading-relaxed tracking-wide">15323411996</p>
                    <p className="text-[14px] text-gray-400">(微信同号)</p>
                  </div>
                </div> */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
