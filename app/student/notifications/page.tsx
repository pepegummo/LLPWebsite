"use client";

import { useState } from "react";
import { useAuthStore, useGroupStore, useNotificationStore } from "@/store";
import { Notification } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
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
    ? userNotifications.filter(
        (n) => n.meta?.groupId === groupFilter
      )
    : userNotifications;

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const typeLabel = (type: string) => {
    if (type === "invitation") return "คำเชิญ";
    if (type === "task_assigned") return "มอบหมายงาน";
    if (type === "eval_reminder") return "เตือนการประเมิน";
    if (type === "invite_response") return "ตอบรับคำเชิญ";
    return type;
  };

  const typeBadgeVariant = (
    type: string
  ): "default" | "secondary" | "outline" | "destructive" => {
    if (type === "invitation") return "default";
    if (type === "task_assigned") return "secondary";
    if (type === "eval_reminder") return "outline";
    return "secondary";
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            การแจ้งเตือน
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">การแจ้งเตือนทั้งหมดของคุณ</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      {/* Group filter tabs */}
      {userGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={groupFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupFilter(null)}
          >
            ทั้งหมด
            <Badge
              variant={groupFilter === null ? "secondary" : "outline"}
              className="ml-1.5 text-xs"
            >
              {userNotifications.length}
            </Badge>
          </Button>
          {userGroups.map((g) => {
            const count = userNotifications.filter(
              (n) => n.meta?.groupId === g.id
            ).length;
            return (
              <Button
                key={g.id}
                variant={groupFilter === g.id ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupFilter(g.id)}
              >
                {g.name}
                {count > 0 && (
                  <Badge
                    variant={groupFilter === g.id ? "secondary" : "outline"}
                    className="ml-1.5 text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ไม่มีการแจ้งเตือน</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
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
              <Card
                key={notif.id}
                className={cn(!notif.read && "border-primary/30 bg-primary/5")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant={typeBadgeVariant(notif.type)}
                          className="text-xs"
                        >
                          {typeLabel(notif.type)}
                        </Badge>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString("th-TH")}
                      </p>
                      {pendingGroup && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAcceptInvitation(notif)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            ยอมรับ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRejectInvitation(notif)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            ปฏิเสธ
                          </Button>
                        </div>
                      )}
                    </div>
                    {!notif.read && !pendingGroup && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          markAsRead(notif.id);
                          toast.success("อ่านแล้ว");
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
