"use client";

import { useState } from "react";
import { useAuthStore, useGroupStore, useNotificationStore } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StaffNotificationsPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  if (!currentUser) return null;

  const userNotifications = notifications
    .filter((n) => n.userId === currentUser.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const filteredNotifications = groupFilter
    ? userNotifications.filter((n) => n.meta?.groupId === groupFilter)
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
    if (type === "invite_response") return "default";
    if (type === "eval_reminder") return "outline";
    return "secondary";
  };

  const handleMarkAllRead = () => {
    markAllAsRead(currentUser.id);
    toast.success("อ่านทั้งหมดแล้ว");
  };

  // Get unique groups referenced in notifications
  const referencedGroupIds = [
    ...new Set(userNotifications.map((n) => n.meta?.groupId).filter(Boolean)),
  ] as string[];
  const referencedGroups = groups.filter((g) =>
    referencedGroupIds.includes(g.id)
  );

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
          <p className="text-muted-foreground">การแจ้งเตือนสำหรับอาจารย์/TA</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      {/* Group filter tabs */}
      {referencedGroups.length > 0 && (
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
          {referencedGroups.map((g) => {
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
          {filteredNotifications.map((notif) => (
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
                  </div>
                  {!notif.read && (
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
          ))}
        </div>
      )}
    </div>
  );
}
