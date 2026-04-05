"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { useGroupStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { groups } = useGroupStore();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const handleLogin = () => {
    if (!selectedUserId) {
      toast.error("กรุณาเลือกผู้ใช้");
      return;
    }

    const user = mockUsers.find((u) => u.id === selectedUserId);
    if (!user) {
      toast.error("ไม่พบผู้ใช้");
      return;
    }

    // Sync user groupIds from current group store state
    const userGroupIds = groups
      .filter((g) => g.memberIds.includes(user.id))
      .map((g) => g.id);

    const syncedUser = {
      ...user,
      groupIds: userGroupIds,
      activeGroupId: userGroupIds.length > 0 ? userGroupIds[0] : null,
    };

    login(syncedUser);
    toast.success(`ยินดีต้อนรับ ${user.name}!`);

    if (user.role === "student") {
      router.replace("/student/dashboard");
    } else {
      router.replace("/staff/dashboard");
    }
  };

  const roleLabel = (role: string) => {
    if (role === "professor") return "อาจารย์";
    if (role === "ta") return "TA";
    return "นักศึกษา";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Project Collab</CardTitle>
          <p className="text-muted-foreground text-sm">ระบบจัดการโปรเจกต์กลุ่ม</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">เลือกผู้ใช้ (Mock Login)</Label>
            <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? "")} items={Object.fromEntries(mockUsers.map((u) => [u.id, u.name]))}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="เลือกผู้ใช้..." />
              </SelectTrigger>
              <SelectContent>
                {mockUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({roleLabel(user.role)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">
                {mockUsers.find((u) => u.id === selectedUserId)?.name}
              </p>
              <p className="text-muted-foreground">
                บทบาท: {roleLabel(mockUsers.find((u) => u.id === selectedUserId)?.role || "")}
              </p>
            </div>
          )}

          <Button onClick={handleLogin} className="w-full" size="lg">
            <LogIn className="w-4 h-4 mr-2" />
            เข้าสู่ระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
