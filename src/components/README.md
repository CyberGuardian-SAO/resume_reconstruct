# 前端 UI 组件 — 集成指南

将 `src/components/` 下的组件复制到你的 React 项目，即可快速集成**用户注册/登录**和**微信支付**的前端界面。

---

## 目录结构

```
src/components/
├── AuthModal.tsx     # 注册/登录弹窗
├── PaymentModal.tsx  # 微信支付弹窗
├── WeChatWidget.tsx  # 微信咨询浮窗（右下角悬浮按钮）
└── README.md         # 本文件
```

---

## 快速集成

### 1. 复制组件文件

将 `src/components/` 目录复制到你项目的对应位置。

### 2. 安装依赖

```bash
npm install lucide-react motion
```

### 3. 使用 AuthModal

```tsx
import { useState } from "react";
import AuthModal from "./components/AuthModal";

function MyPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");

  const handleSendCode = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, password: authPassword, passwordConfirm: authPasswordConfirm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setAuthMessage("验证码已发送");
    } catch (err: any) {
      setAuthMessage(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/register/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, code: authCode, password: authPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      localStorage.setItem("sessionToken", data.sessionToken);
      setShowAuthModal(false);
      // 注册成功，刷新页面或更新状态
    } catch (err: any) {
      setAuthMessage(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, password: authPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      localStorage.setItem("sessionToken", data.sessionToken);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthMessage(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setShowAuthModal(true)}>注册 / 登录</button>

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
    </div>
  );
}
```

### 4. 使用 PaymentModal

```tsx
import { useState } from "react";
import PaymentModal from "./components/PaymentModal";

function MyPage() {
  const sessionToken = localStorage.getItem("sessionToken") || "";
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCodeUrl, setPaymentCodeUrl] = useState("");
  const [paymentOrderNo, setPaymentOrderNo] = useState("");
  const [copiedQRCode, setCopiedQRCode] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [freeQuota, setFreeQuota] = useState<number | null>(0);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleCreatePayment = async () => {
    setShowPaymentModal(true);
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ amountCents: 100, description: "付费使用一次服务" }),
      });
      const data = await res.json();
      setPaymentOrderNo(data.paymentId);
      setPaymentCodeUrl(data.codeUrl);
      setPaymentStatusMessage("订单已创建，请扫码支付");
      pollPaymentStatus(data.paymentId);
    } catch (err: any) {
      setPaymentStatusMessage(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const pollPaymentStatus = (paymentId: string, maxAttempts = 24, intervalMs = 5000) => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch("/api/payment/status", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({ paymentId }),
        });
        const data = await res.json();
        if (data.status === "PAID") {
          clearInterval(timer);
          setShowPaymentModal(false);
          setPaymentStatusMessage(null);
          setPaymentCodeUrl("");
          setPaymentOrderNo("");
          alert("支付成功！额度已到账。");
          return;
        }
      } catch {}
      if (attempts >= maxAttempts) clearInterval(timer);
    }, intervalMs);
  };

  const handleCheckPaymentStatus = async () => {
    if (!paymentOrderNo) return;
    try {
      const res = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ paymentId: paymentOrderNo }),
      });
      const data = await res.json();
      if (data.status === "PAID") {
        setShowPaymentModal(false);
        setPaymentCodeUrl("");
        setPaymentOrderNo("");
        alert("支付成功！额度已到账。");
      } else {
        setPaymentStatusMessage(`当前状态：${data.status === "PENDING" ? "待支付" : data.status}`);
      }
    } catch (err: any) {
      setPaymentStatusMessage(err.message);
    }
  };

  return (
    <div>
      <button onClick={handleCreatePayment}>付费使用</button>

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
    </div>
  );
}
```

### 5. 使用 WeChatWidget

```tsx
import { WeChatWidget } from "./components/WeChatWidget";

function App() {
  return (
    <div>
      {/* ... your app content ... */}
      <WeChatWidget />
    </div>
  );
}
```

---

## 组件 Props 说明

### AuthModal Props

| Prop | 类型 | 说明 |
|------|------|------|
| `show` | `boolean` | 控制弹窗显示/隐藏 |
| `authMode` | `"register" \| "login"` | 当前模式：注册或登录 |
| `authPhone` | `string` | 手机号输入值 |
| `authPassword` | `string` | 密码输入值 |
| `authPasswordConfirm` | `string` | 确认密码输入值（注册模式） |
| `authCode` | `string` | 短信验证码输入值（注册模式） |
| `authLoading` | `boolean` | 加载状态，禁用按钮 |
| `authMessage` | `string \| null` | 提示消息内容 |
| `onClose` | `() => void` | 关闭弹窗回调 |
| `onModeChange` | `(mode) => void` | 切换注册/登录模式 |
| `onPhoneChange` | `(val) => void` | 手机号输入变化 |
| `onPasswordChange` | `(val) => void` | 密码输入变化 |
| `onPasswordConfirmChange` | `(val) => void` | 确认密码输入变化 |
| `onCodeChange` | `(val) => void` | 验证码输入变化 |
| `onSendCode` | `() => void` | 点击"获取验证码" |
| `onVerifyCode` | `() => void` | 点击注册"完成验证登记" |
| `onLogin` | `() => void` | 点击"直接登录" |

### PaymentModal Props

| Prop | 类型 | 说明 |
|------|------|------|
| `show` | `boolean` | 控制弹窗显示/隐藏 |
| `sessionToken` | `string` | 当前会话 token（用于内部条件判断） |
| `freeQuota` | `number \| null` | 免费额度（为 0 时显示支付界面） |
| `paymentCodeUrl` | `string` | 微信支付二维码 URL |
| `paymentOrderNo` | `string` | 订单编号 |
| `copiedQRCode` | `boolean` | 是否已复制二维码链接 |
| `paymentStatusMessage` | `string \| null` | 支付状态提示消息 |
| `onClose` | `() => void` | 关闭弹窗回调 |
| `onCheckPaymentStatus` | `() => void` | 手动查询支付状态 |
| `onCopyQRCode` | `() => void` | 复制二维码链接到剪贴板 |

### WeChatWidget

无 Props。固定在页面右下角显示绿色微信咨询按钮，hover 展开二维码和联系方式。

---

## 样式依赖

组件使用 **Tailwind CSS**。确保你的项目已配置 Tailwind：

```bash
npm install -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

如果未使用 Tailwind，可复制组件的 className 并替换为你的 CSS 方案。
