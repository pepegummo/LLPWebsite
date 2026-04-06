"use client";

import { Menu, ClipboardList } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-card border-b border-border shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center shrink-0">
          <ClipboardList className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm">Multi</span>
      </div>
    </div>
  );
}
