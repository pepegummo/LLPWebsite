"use client";

import { Menu } from "lucide-react";
import { useAuthStore } from "@/store";
import { NotificationPanel } from "./NotificationPanel";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { currentUser } = useAuthStore();

  return (
    <div className="sticky top-0 z-20 flex items-center px-4 h-14 bg-card border-b border-border shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1" />
      {currentUser && <NotificationPanel />}
    </div>
  );
}
