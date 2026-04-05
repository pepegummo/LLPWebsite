"use client";

import { useAuthStore, useGroupStore } from "@/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

export function GroupSwitcher() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { groups } = useGroupStore();

  if (!currentUser || currentUser.role !== "student") return null;

  const userGroups = groups.filter((g) =>
    g.memberIds.includes(currentUser.id)
  );

  if (userGroups.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        ไม่มีกลุ่ม
      </div>
    );
  }

  const handleChange = (groupId: string | null) => {
    if (!groupId) return;
    updateCurrentUser({ ...currentUser, activeGroupId: groupId });
  };

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        <Users className="w-3 h-3" />
        กลุ่มปัจจุบัน
      </p>
      <Select
        value={currentUser.activeGroupId ?? ""}
        onValueChange={handleChange}
        items={Object.fromEntries(userGroups.map((g) => [g.id, g.name]))}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="เลือกกลุ่ม..." />
        </SelectTrigger>
        <SelectContent>
          {userGroups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
