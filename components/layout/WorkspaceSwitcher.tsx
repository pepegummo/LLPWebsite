"use client";

import { useAuthStore, useWorkspaceStore } from "@/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers } from "lucide-react";

export function WorkspaceSwitcher() {
  const { currentUser, setActiveWorkspace } = useAuthStore();
  const { workspaces, getWorkspacesByUser } = useWorkspaceStore();

  if (!currentUser) return null;

  const userWorkspaces = getWorkspacesByUser(currentUser.id);

  if (userWorkspaces.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        ยังไม่มี Workspace
      </div>
    );
  }

  const activeId = currentUser.activeWorkspaceId ?? "";

  const handleChange = (wsId: string | null) => {
    setActiveWorkspace(wsId || null);
  };

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
        <Layers className="w-3 h-3" />
        Workspace
      </p>
      <Select value={activeId} onValueChange={handleChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="เลือก Workspace...">
            {activeId
              ? (userWorkspaces.find((w) => w.id === activeId)?.name ?? "เลือก Workspace...")
              : "เลือก Workspace..."}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userWorkspaces.map((ws) => (
            <SelectItem key={ws.id} value={ws.id}>
              {ws.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
