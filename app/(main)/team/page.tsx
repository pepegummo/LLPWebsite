"use client";

import { useState } from "react";
import { useAuthStore, useTeamStore, useTaskStore, useNotificationStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { useDisplayName } from "@/lib/useDisplayName";
import { TeamRole } from "@/types";
import { WorkloadBar } from "@/components/WorkloadBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Users, User, Shuffle, UserPlus, Shield, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/badge-constants";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export default function StudentTeamPage() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { teams, updateTeam, getUserRole, setMemberRole, removeMember, inviteUser, rejectInvitation } = useTeamStore();
  const { tasks, updateTask } = useTaskStore();
  const { addNotification } = useNotificationStore();
  const resolveDisplayName = useDisplayName();

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState<string>("");

  if (!currentUser) return null;

  const activeTeam = teams.find((t) => t.id === currentUser.activeTeamId);
  if (!activeTeam) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ทีมของฉัน</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีทีมที่ใช้งานอยู่ — เลือกทีมจาก Team Switcher
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = getUserRole(activeTeam.id, currentUser.id);
  const isLeader = userRole === "team_leader" || userRole === "assistant_leader";
  const isTeamLeader = userRole === "team_leader";

  const memberIds = activeTeam.members.map((m) => m.userId);
  const members = mockUsers.filter((u) => memberIds.includes(u.id));
  const teamTasks = tasks.filter((t) => t.teamId === activeTeam.id);

  // Users not in team and not already invited
  const invitableUsers = mockUsers.filter(
    (u) => !memberIds.includes(u.id) && !activeTeam.invitedIds.includes(u.id)
  );

  // Pending invitations
  const pendingInvitees = activeTeam.invitedIds;

  const handleReassign = () => {
    if (!activeTeam || members.length === 0) return;
    const pendingTasks = teamTasks.filter((t) => t.status === "todo" || t.status === "in_progress");
    if (pendingTasks.length === 0) {
      toast.info("ไม่มีงานที่ต้องจัดสรรใหม่");
      return;
    }

    const sorted = [...pendingTasks].sort((a, b) => (b.manHours ?? 1) - (a.manHours ?? 1));
    const memberHours: Record<string, number> = {};
    members.forEach((m) => {
      const doneHours = teamTasks
        .filter((t) => t.status === "done" && t.assigneeIds.includes(m.id))
        .reduce((s, t) => s + (t.manHours ?? 1), 0);
      memberHours[m.id] = doneHours;
    });

    sorted.forEach((task) => {
      const leastLoaded = members.reduce(
        (minId, m) => memberHours[m.id] < memberHours[minId] ? m.id : minId,
        members[0].id
      );
      updateTask({ ...task, assigneeIds: [leastLoaded] });
      memberHours[leastLoaded] += task.manHours ?? 1;
    });

    toast.success(`จัดสรรงานใหม่ ${pendingTasks.length} งาน ให้สมาชิก ${members.length} คน`);
  };

  const handleInvite = () => {
    if (!selectedInviteId) return;
    const user = mockUsers.find((u) => u.id === selectedInviteId);
    if (!user) return;

    inviteUser(activeTeam.id, selectedInviteId);

    addNotification({
      id: generateId(),
      userId: selectedInviteId,
      type: "invitation",
      message: `คุณได้รับคำเชิญเข้าร่วมทีม ${activeTeam.name}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { teamId: activeTeam.id },
    });

    setSelectedInviteId("");
    setShowInvitePanel(false);
    toast.success(`ส่งคำเชิญให้ ${resolveDisplayName(user.id, user.name, activeTeam.id)} แล้ว`);
  };

  const handleCancelInvite = (userId: string) => {
    rejectInvitation(activeTeam.id, userId);
    toast.success("ยกเลิกคำเชิญแล้ว");
  };

  const handleSetRole = (userId: string, role: TeamRole) => {
    setMemberRole(activeTeam.id, userId, role);
    const user = mockUsers.find((u) => u.id === userId);
    toast.success(`เปลี่ยน ${resolveDisplayName(userId, user?.name ?? userId, activeTeam.id)} เป็น ${ROLE_LABELS[role]} แล้ว`);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember(activeTeam.id, userId);
    // If removed member was current user's active team, reset nothing (they'll see team was updated)
    setRemovingMemberId(null);
    const user = mockUsers.find((u) => u.id === userId);
    toast.success(`ลบ ${resolveDisplayName(userId, user?.name ?? userId, activeTeam.id)} ออกจากทีมแล้ว`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">ทีมของฉัน</h1>
          <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
        </div>
        <div className="flex gap-2">
          {isLeader && (
            <Button variant="outline" size="sm" onClick={() => setShowInvitePanel((v) => !v)}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              ชวนเพื่อน
            </Button>
          )}
          {members.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleReassign}>
              <Shuffle className="w-4 h-4 mr-1.5" />
              Re-assign
            </Button>
          )}
        </div>
      </div>

      {/* Invite panel */}
      {showInvitePanel && isLeader && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              ชวนสมาชิกใหม่
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีผู้ใช้ที่สามารถชวนได้</p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedInviteId} onValueChange={(v) => { if (v) setSelectedInviteId(v); }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue>
                      {(v: string | null) => v ? (invitableUsers.find((u) => u.id === v)?.name ?? "เลือกผู้ใช้...") : "เลือกผู้ใช้ที่ต้องการชวน..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {invitableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={!selectedInviteId}>
                  ส่งคำเชิญ
                </Button>
              </div>
            )}

            {/* Pending invitations */}
            {pendingInvitees.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">รอตอบรับ ({pendingInvitees.length})</p>
                {pendingInvitees.map((userId) => {
                  const user = mockUsers.find((u) => u.id === userId);
                  return (
                    <div key={userId} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <span className="text-sm">{user?.name ?? userId}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleCancelInvite(userId)}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          สมาชิก ({members.length} คน)
        </h2>
        {members.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">ไม่มีสมาชิก</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTeam.members.map((memberEntry) => {
              const member = mockUsers.find((u) => u.id === memberEntry.userId);
              if (!member) return null;

              const memberTasks = teamTasks.filter((t) => t.assigneeIds.includes(member.id));
              const doneTasks = memberTasks.filter((t) => t.status === "done").length;
              const overdueTasks = memberTasks.filter(
                (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
              ).length;
              const totalHours = memberTasks.reduce((s, t) => s + (t.manHours ?? 0), 0);
              const isMe = member.id === currentUser.id;
              const isThisLeader = memberEntry.role === "team_leader";

              return (
                <Card key={member.id} className={isMe ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {isThisLeader ? (
                          <Crown className="w-5 h-5 text-amber-500" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{resolveDisplayName(member.id, member.name, activeTeam.id)}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[memberEntry.role]}`}>
                            {ROLE_LABELS[memberEntry.role]}
                          </span>
                          {isMe && <Badge variant="outline" className="text-xs">คุณ</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                      <p>งาน: {memberTasks.length} ({doneTasks} เสร็จ)</p>
                      {totalHours > 0 && <p>Man Hours: {totalHours} ชม.</p>}
                      {overdueTasks > 0 && <p className="text-destructive">เกินกำหนด: {overdueTasks}</p>}
                    </div>

                    {/* Leader actions */}
                    {isLeader && !isMe && (
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        {isTeamLeader && (
                          <Select
                            value={memberEntry.role}
                            onValueChange={(v) => handleSetRole(member.id, v as TeamRole)}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <Shield className="w-3 h-3 mr-1" />
                              <SelectValue>{(v: string | null) => v ? ROLE_LABELS[v as TeamRole] : ""}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="assistant_leader">Assistant Leader</SelectItem>
                              {isTeamLeader && <SelectItem value="team_leader">Team Leader</SelectItem>}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setRemovingMemberId(member.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Workload */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">ภาระงาน</h2>
        <Card>
          <CardContent className="p-4">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">ไม่มีสมาชิก</p>
            ) : (
              <WorkloadBar tasks={teamTasks} memberIds={memberIds} teamId={activeTeam.id} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove member confirmation */}
      <AlertDialog open={!!removingMemberId} onOpenChange={(open) => !open && setRemovingMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบสมาชิก</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ {resolveDisplayName(removingMemberId ?? "", mockUsers.find((u) => u.id === removingMemberId)?.name ?? "", activeTeam.id)} ออกจากทีมหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingMemberId && handleRemoveMember(removingMemberId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
