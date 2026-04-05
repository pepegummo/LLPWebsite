"use client";

import { useState } from "react";
import { useGroupStore, useNotificationStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

interface InviteModalProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ groupId, open, onClose }: InviteModalProps) {
  const { groups, inviteUser } = useGroupStore();
  const { addNotification } = useNotificationStore();
  const [selectedUserId, setSelectedUserId] = useState("");

  const group = groups.find((g) => g.id === groupId);

  // Students not already in group and not already invited
  const availableStudents = mockUsers.filter(
    (u) =>
      u.role === "student" &&
      !group?.memberIds.includes(u.id) &&
      !group?.invitedIds.includes(u.id)
  );

  const handleInvite = () => {
    if (!selectedUserId) {
      toast.error("กรุณาเลือกนักศึกษา");
      return;
    }

    const user = mockUsers.find((u) => u.id === selectedUserId);
    if (!user || !group) return;

    inviteUser(groupId, selectedUserId);

    // Send notification to student
    addNotification({
      id: generateId(),
      userId: selectedUserId,
      type: "invitation",
      message: `คุณได้รับคำเชิญให้เข้าร่วมกลุ่ม ${group.name}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { groupId },
    });

    toast.success(`ส่งคำเชิญให้ ${user.name} แล้ว`);
    setSelectedUserId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เชิญสมาชิกเข้ากลุ่ม {group?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>เลือกนักศึกษา</Label>
            <Select
              value={selectedUserId}
              onValueChange={(v) => setSelectedUserId(v ?? "")}
              items={Object.fromEntries(availableStudents.map((u) => [u.id, u.name]))}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกนักศึกษา..." />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    ไม่มีนักศึกษาที่สามารถเชิญได้
                  </SelectItem>
                ) : (
                  availableStudents.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleInvite}
            disabled={availableStudents.length === 0}
          >
            ส่งคำเชิญ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
