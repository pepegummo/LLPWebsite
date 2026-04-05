"use client";

import { Group } from "@/types";
import { useGroupStore, useAuthStore, useNotificationStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Check, X } from "lucide-react";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

interface InvitationCardProps {
  group: Group;
}

export function InvitationCard({ group }: InvitationCardProps) {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { acceptInvitation, rejectInvitation } = useGroupStore();
  const { notifications, addNotification, markAsRead } = useNotificationStore();

  const handleAccept = () => {
    if (!currentUser) return;
    acceptInvitation(group.id, currentUser.id);

    // Update user's groupIds and set active group if none
    const newGroupIds = [...new Set([...currentUser.groupIds, group.id])];
    updateCurrentUser({
      ...currentUser,
      groupIds: newGroupIds,
      activeGroupId: currentUser.activeGroupId ?? group.id,
    });

    // Mark the original invitation notification as read
    const inviteNotif = notifications.find(
      (n) => n.userId === currentUser.id && n.type === "invitation" && n.meta?.groupId === group.id
    );
    if (inviteNotif) markAsRead(inviteNotif.id);

    // Notify staff
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

  const handleReject = () => {
    if (!currentUser) return;
    rejectInvitation(group.id, currentUser.id);

    // Mark the original invitation notification as read
    const inviteNotif = notifications.find(
      (n) => n.userId === currentUser.id && n.type === "invitation" && n.meta?.groupId === group.id
    );
    if (inviteNotif) markAsRead(inviteNotif.id);

    // Notify staff
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
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{group.name}</p>
              <p className="text-xs text-muted-foreground">
                {group.memberIds.length} สมาชิก
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            คำเชิญ
          </Badge>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1" onClick={handleAccept}>
            <Check className="w-3 h-3 mr-1" />
            ยอมรับ
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleReject}
          >
            <X className="w-3 h-3 mr-1" />
            ปฏิเสธ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
