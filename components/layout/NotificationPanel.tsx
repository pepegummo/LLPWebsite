"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  Users,
  ClipboardList,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useNotificationStore, useAuthStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getTypeIcon(type: string) {
  if (type === "invitation") return <Users className="w-3.5 h-3.5" />;
  if (type === "task_assigned") return <ClipboardList className="w-3.5 h-3.5" />;
  if (type === "eval_reminder") return <Clock className="w-3.5 h-3.5" />;
  if (type === "invite_response") return <Check className="w-3.5 h-3.5" />;
  return <Bell className="w-3.5 h-3.5" />;
}

function getTypeColor(type: string) {
  if (type === "invitation")
    return "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400";
  if (type === "task_assigned")
    return "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400";
  if (type === "eval_reminder")
    return "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400";
  if (type === "invite_response")
    return "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400";
  return "bg-muted text-muted-foreground";
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "เมื่อกี้";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH");
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuthStore();
  const { notifications, markAllAsRead, markAsRead, getUnreadCount } =
    useNotificationStore();

  const count = currentUser ? getUnreadCount(currentUser.id) : 0;
  const notifHref = "/notifications";

  const recentNotifications = currentUser
    ? notifications
        .filter((n) => n.userId === currentUser.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!currentUser) return null;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          open
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        aria-label="การแจ้งเตือน"
      >
        {count > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">การแจ้งเตือน</span>
              {count > 0 && (
                <Badge
                  variant="destructive"
                  className="text-[10px] px-1.5 py-0 h-4 min-w-4 rounded-full"
                >
                  {count}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => {
                    markAllAsRead(currentUser.id);
                    toast.success("อ่านทั้งหมดแล้ว");
                  }}
                  title="อ่านทั้งหมด"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {recentNotifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="w-9 h-9 mx-auto mb-3 opacity-20" />
                <p className="text-sm">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <button
                  key={notif.id}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors",
                    !notif.read && "bg-primary/[0.04]"
                  )}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id);
                  }}
                >
                  {/* Icon */}
                  <span
                    className={cn(
                      "mt-0.5 p-1.5 rounded-lg shrink-0",
                      getTypeColor(notif.type)
                    )}
                  >
                    {getTypeIcon(notif.type)}
                  </span>
                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className={cn(
                        "text-sm leading-snug line-clamp-2",
                        !notif.read ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                  {/* Unread dot */}
                  {!notif.read && (
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/20">
            <Link
              href={notifHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ดูการแจ้งเตือนทั้งหมด
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
