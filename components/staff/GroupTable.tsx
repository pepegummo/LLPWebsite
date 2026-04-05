"use client";

import { useState } from "react";
import { Group } from "@/types";
import { useGroupStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { InviteModal } from "./InviteModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, UserMinus, Trash2, Users } from "lucide-react";

interface GroupTableProps {
  groups: Group[];
}

export function GroupTable({ groups }: GroupTableProps) {
  const { removeMember, deleteGroup } = useGroupStore();
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const handleRemoveMember = (groupId: string, userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    removeMember(groupId, userId);
    toast.success(`ลบ ${user?.name ?? userId} ออกจากกลุ่มแล้ว`);
  };

  const handleDeleteGroup = () => {
    if (!deleteGroupId) return;
    deleteGroup(deleteGroupId);
    toast.success("ลบกลุ่มแล้ว");
    setDeleteGroupId(null);
  };

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          ยังไม่มีกลุ่ม
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => {
          const members = mockUsers.filter((u) =>
            group.memberIds.includes(u.id)
          );
          const invited = mockUsers.filter((u) =>
            group.invitedIds.includes(u.id)
          );

          return (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {group.name}
                    <Badge variant="secondary" className="text-xs">
                      {members.length} สมาชิก
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInviteGroupId(group.id)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      เชิญ
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteGroupId(group.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Members */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    สมาชิก
                  </p>
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">ไม่มีสมาชิก</p>
                  ) : (
                    <div className="space-y-1">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted"
                        >
                          <span className="text-sm">{m.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveMember(group.id, m.id)}
                          >
                            <UserMinus className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending invitations */}
                {invited.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      รอตอบรับ ({invited.length})
                    </p>
                    <div className="space-y-1">
                      {invited.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 py-1 px-2"
                        >
                          <Badge variant="outline" className="text-xs">
                            รอตอบรับ
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {u.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {inviteGroupId && (
        <InviteModal
          groupId={inviteGroupId}
          open={!!inviteGroupId}
          onClose={() => setInviteGroupId(null)}
        />
      )}

      <AlertDialog
        open={!!deleteGroupId}
        onOpenChange={() => setDeleteGroupId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบกลุ่ม</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบกลุ่มนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
