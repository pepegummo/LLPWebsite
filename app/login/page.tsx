"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ClipboardList,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  LogIn,
  User,
} from "lucide-react";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials } = useAuthStore();

  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setLoading(true);
    try {
      await loginWithCredentials(loginEmail, loginPassword);
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      toast.error("กรุณากรอกอีเมล รหัสผ่าน และชื่อ");
      return;
    }
    setLoading(true);
    try {
      await api.auth.register(
        regEmail,
        regPassword,
        regName,
        regFirstName || undefined,
        regLastName || undefined,
      );
      // Auto-login after successful registration
      await loginWithCredentials(regEmail, regPassword);
      toast.success("สมัครสมาชิกสำเร็จ ยินดีต้อนรับ!");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4 shadow-lg">
            <ClipboardList className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Multi</h1>
          <p className="text-slate-500 text-sm mt-1">ระบบจัดการโปรเจกต์กลุ่ม</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                tab === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                tab === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              สมัครสมาชิก
            </button>
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-slate-700 text-sm">
                  อีเมล
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@university.ac.th"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-slate-700 text-sm">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-9 pr-9"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                เข้าสู่ระบบ
              </Button>

              <p className="text-center text-xs text-slate-400">
                ยังไม่มีบัญชี?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-primary hover:underline font-medium"
                >
                  สมัครสมาชิก
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-slate-700 text-sm">
                  ชื่อที่แสดง <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="reg-name"
                    placeholder="ชื่อที่ใช้แสดงในระบบ"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-firstname" className="text-slate-700 text-sm">
                    ชื่อจริง
                  </Label>
                  <Input
                    id="reg-firstname"
                    placeholder="ชื่อจริง"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-lastname" className="text-slate-700 text-sm">
                    นามสกุล
                  </Label>
                  <Input
                    id="reg-lastname"
                    placeholder="นามสกุล"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-slate-700 text-sm">
                  อีเมล <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="email@university.ac.th"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-slate-700 text-sm">
                  รหัสผ่าน <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่และตัวเลข"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-9 pr-9"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข อย่างน้อย 8 ตัวอักษร
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                สมัครสมาชิก
              </Button>

              <p className="text-center text-xs text-slate-400">
                มีบัญชีแล้ว?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-primary hover:underline font-medium"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Multi · ระบบจัดการโปรเจกต์
        </p>
      </div>
    </div>
  );
}
