"use client";

import { useState } from "react";
import { useAuthStore, useGroupStore, useNotificationStore } from "@/store";
import { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BellOff,
  CheckCheck,
  Check,
  X,
  Users,
  ClipboardList,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function getTypeIcon(type: string) {
  if (type === "invitation") return <Users className="w-4 h-4" />;
  if (type === "task_assigned") return <ClipboardList className="w-4 h-4" />;
  if (type === "eval_reminder") return <Clock className="w-4 h-4" />;
  if (type === "invite_response") return <Check className="w-4 h-4" />;
  return <Bell className="w-4 h-4" />;
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

function getTypeLabel(type: string) {
  if (type === "invitation") return "คำเชิญ";
  if (type === "task_assigned") return "มอบหมายงาน";
  if (type === "eval_reminder") return "เตือนการประเมิน";
  if (type === "invite_response") return "ตอบรับคำเชิญ";
  return type;
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
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentNotificationsPage() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { groups, acceptInvitation, rejectInvitation } = useGroupStore();
  const { notifications, markAsRead, markAllAsRead, addNotification } =
    useNotificationStore();

  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  if (!currentUser) return null;

  const userNotifications = notifications
    .filter((n) => n.userId === currentUser.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const userGroups = groups.filter((g) => g.memberIds.includes(currentUser.id));

  const filteredNotifications = groupFilter
    ? userNotifications.filter((n) => n.meta?.groupId === groupFilter)
    : userNotifications;

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllAsRead(currentUser.id);
    toast.success("อ่านทั้งหมดแล้ว");
  };

  const handleAcceptInvitation = (notif: Notification) => {
    if (!notif.meta?.groupId) return;
    const group = groups.find((g) => g.id === notif.meta!.groupId);
    if (!group) return;

    acceptInvitation(group.id, currentUser.id);

    const newGroupIds = [...new Set([...currentUser.groupIds, group.id])];
    updateCurrentUser({
      ...currentUser,
      groupIds: newGroupIds,
      activeGroupId: currentUser.activeGroupId ?? group.id,
    });

    markAsRead(notif.id);

    addNotification({
      id: generateId(),
      userId: "prof1",
      type: "invite_response",
      message: `${currentUser.name} ได้ยอมรับคำเชิญเข้ากลุ่ม ${group.name}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { groupId: group.id, userId: currentUser.id },
    });
    addNotification({
      id: generateId(),
      userId: "ta1",
      type: "invite_response",
      message: `${currentUser.name} ได้ยอมรับคำเชิญเข้ากลุ่ม ${group.name}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { groupId: group.id, userId: currentUser.id },
    });

    toast.success(`ยอมรับคำเชิญเข้ากลุ่ม ${group.name} แล้ว`);
  };

  const handleRejectInvitation = (notif: Notification) => {
    if (!notif.meta?.groupId) return;
    const group = groups.find((g) => g.id === notif.meta!.groupId);
    if (!group) return;

    rejectInvitation(group.id, currentUser.id);
    markAsRead(notif.id);

    addNotification({
      id: generateId(),
      userId: "prof1",
      type: "invite_response",
      message: `${currentUser.name} ได้ปฏิเสธคำเชิญเข้ากลุ่ม ${group.name}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { groupId: group.id, userId: currentUser.id },
    });
    addNotification({
      id: generateId(),
      userId: "ta1",
      type: "invite_response",
      message: `${currentUser.name} ได้ปฏิเสธคำเชิญเข้ากลุ่ม ${group.name}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { groupId: group.id, userId: currentUser.id },
    });

    toast.success(`ปฏิเสธคำเชิญเข้ากลุ่ม ${group.name} แล้ว`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">การแจ้งเตือน</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `ยังไม่ได้อ่าน ${unreadCount} รายการ`
              : "อ่านครบทุกรายการแล้ว"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheck className="w-3.5 h-3.5" />
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      {userGroups.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setGroupFilter(null)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              groupFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            ทั้งหมด
            <span
              className={cn(
                "text-xs rounded-full px-1.5 py-0 leading-5",
                groupFilter === null
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-border text-muted-foreground"
              )}
            >
              {userNotifications.length}
            </span>
          </button>
          {userGroups.map((g) => {
            const count = userNotifications.filter(
              (n) => n.meta?.groupId === g.id
            ).length;
            const active = groupFilter === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setGroupFilter(g.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {g.name}
                {count > 0 && (
                  <span
                    className={cn(
                      "text-xs rounded-full px-1.5 py-0 leading-5",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-border text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <BellOff className="w-10 h-10 mb-3 opacity-25" />
          <p className="text-sm font-medium">ไม่มีการแจ้งเตือน</p>
          <p className="text-xs mt-1 opacity-70">
            {groupFilter ? "ไม่มีการแจ้งเตือนในกลุ่มนี้" : "ยังไม่มีการแจ้งเตือนในขณะนี้"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
          {filteredNotifications.map((notif) => {
            const pendingGroup =
              notif.type === "invitation" && notif.meta?.groupId
                ? groups.find(
                    (g) =>
                      g.id === notif.meta!.groupId &&
                      g.invitedIds.includes(currentUser.id)
                  )
                : null;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors",
                  !notif.read
                    ? "bg-primary/[0.04] border-l-2 border-l-primary"
                    : "bg-card hover:bg-muted/30"
                )}
              >
                {/* Icon */}
                <span
                  className={cn(
                    "mt-0.5 p-2 rounded-xl shrink-0",
                    getTypeColor(notif.type)
                  )}
                >
                  {getTypeIcon(notif.type)}
                </span>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">
                        {getTypeLabel(notif.type)}
                      </p>
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notif.read ? "font-medium text-foreground" : "text-foreground/80"
                        )}
                      >
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>

                    {/* Mark read */}
                    {!notif.read && !pendingGroup && (
                      <button
                        className="mt-0.5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                        onClick={() => {
                          markAsRead(notif.id);
                          toast.success("อ่านแล้ว");
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Invitation actions */}
                  {pendingGroup && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="h-8 px-4 text-xs"
                        onClick={() => handleAcceptInvitation(notif)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        ยอมรับ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-4 text-xs"
                        onClick={() => handleRejectInvitation(notif)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        ปฏิเสธ
                      </Button>
                    </div>
                  )}
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
