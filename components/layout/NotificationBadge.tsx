"use client";

import { useNotificationStore, useAuthStore } from "@/store";
import { Bell } from "lucide-react";

export function NotificationBadge() {
  const { currentUser } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();

  const count = currentUser ? getUnreadCount(currentUser.id) : 0;

  return (
    <span className="relative inline-flex">
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </span>
  );
}
