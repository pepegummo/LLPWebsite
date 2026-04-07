"use client";

import { useAuthStore, useTeamStore } from "@/store";
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
  const { getTeamsByUser } = useTeamStore();

  if (!currentUser) return null;

  const userTeams = getTeamsByUser(currentUser.id);

  if (userTeams.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        ยังไม่มีทีม
      </div>
    );
  }

  const handleChange = (teamId: string | null) => {
    if (!teamId) return;
    updateCurrentUser({ ...currentUser, activeTeamId: teamId });
  };

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        <Users className="w-3 h-3" />
        ทีมปัจจุบัน
      </p>
      <Select
        value={currentUser.activeTeamId ?? ""}
        onValueChange={handleChange}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue>
              {(v: string | null) =>
                v ? (userTeams.find((t) => t.id === v)?.name ?? "เลือกทีม...") : "เลือกทีม..."
              }
            </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userTeams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
