"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useGroupStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, Lock, Mail, Eye, EyeOff, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { groups } = useGroupStore();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [mockExpanded, setMockExpanded] = useState(false);

  const handleMockLogin = () => {
    if (!selectedUserId) {
      toast.error("กรุณาเลือกผู้ใช้");
      return;
    }
    const user = mockUsers.find((u) => u.id === selectedUserId);
    if (!user) {
      toast.error("ไม่พบผู้ใช้");
      return;
    }

    const userGroupIds = groups
      .filter((g) => g.memberIds.includes(user.id))
      .map((g) => g.id);

    login({
      ...user,
      groupIds: userGroupIds,
      activeGroupId: userGroupIds.length > 0 ? userGroupIds[0] : null,
    });

    toast.success(`ยินดีต้อนรับ ${user.name}!`);
    router.replace(user.role === "student" ? "/student/dashboard" : "/staff/dashboard");
  };

  const roleLabel = (role: string) => {
    if (role === "professor") return "อาจารย์";
    if (role === "ta") return "TA";
    return "นักศึกษา";
  };

  const roleBadgeColor = (role: string) => {
    if (role === "professor") return "bg-purple-100 text-purple-700";
    if (role === "ta") return "bg-blue-100 text-blue-700";
    return "bg-green-100 text-green-700";
  };

  const selectedUser = mockUsers.find((u) => u.id === selectedUserId);

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
          {/* Email/Password section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-slate-800">เข้าสู่ระบบ</h2>
              <Badge variant="secondary" className="text-xs gap-1 text-slate-500">
                <Lock className="w-3 h-3" />
                Coming Soon
              </Badge>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 text-sm">
                อีเมล
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@university.ac.th"
                  disabled
                  className="pl-9 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 text-sm">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled
                  className="pl-9 pr-9 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 cursor-not-allowed"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button disabled className="w-full bg-slate-100 text-slate-400 cursor-not-allowed" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              เข้าสู่ระบบ
            </Button>

            <p className="text-center text-xs text-slate-400">
              ระบบ authentication จริงอยู่ระหว่างการพัฒนา
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">หรือ</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Mock login section */}
          <div className="p-6 space-y-4 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setMockExpanded((v) => !v)}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700">Mock Login</p>
                  <p className="text-xs text-slate-400">สำหรับ development &amp; demo</p>
                </div>
              </div>
              {mockExpanded
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />
              }
            </button>

            {mockExpanded && (
              <div className="space-y-3 pt-1">
                {/* User selector */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm">เลือกบัญชีทดสอบ</Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={(v) => setSelectedUserId(v ?? "")}
                    items={Object.fromEntries(mockUsers.map((u) => [u.id, u.name]))}
                  >
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="เลือกผู้ใช้..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Group by role */}
                      {(["professor", "ta", "student"] as const).map((role) => {
                        const roleUsers = mockUsers.filter((u) => u.role === role);
                        if (roleUsers.length === 0) return null;
                        return (
                          <div key={role}>
                            <div className="px-2 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                              {roleLabel(role)}
                            </div>
                            {roleUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <span>{user.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected user preview */}
                {selectedUser && (
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {selectedUser.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        ID: {selectedUser.id}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(selectedUser.role)}`}>
                      {roleLabel(selectedUser.role)}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleMockLogin}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  size="lg"
                  disabled={!selectedUserId}
                >
                  <FlaskConical className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบด้วย Mock Account
                </Button>
              </div>
            )}

            {!mockExpanded && (
              <button
                type="button"
                onClick={() => setMockExpanded(true)}
                className="w-full text-xs text-slate-400 hover:text-amber-600 transition-colors text-center"
              >
                คลิกเพื่อใช้ Mock Login →
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Multi · ระบบจัดการโปรเจกต์
        </p>
      </div>
    </div>
  );
}
