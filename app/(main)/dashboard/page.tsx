"use client";

import Link from "next/link";
import { useAuthStore, useTaskStore, useTeamStore, useNotificationStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, ListTodo, ChevronRight, Bell } from "lucide-react";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export default function StudentDashboardPage() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { getTeamsByUser, getUserRole, acceptInvitation, rejectInvitation, teams } = useTeamStore();
  const { notifications, markAsRead, addNotification } = useNotificationStore();

  if (!currentUser) return null;

  // Pending invitations
  const pendingInvitations = teams.filter((t) =>
    t.invitedIds.includes(currentUser.id)
  );

  // User's teams
  const userTeams = getTeamsByUser(currentUser.id);

  // Overall stats across all teams
  const allMyTasks = tasks.filter((t) =>
    userTeams.some((tm) => tm.id === t.teamId) && t.assigneeIds.includes(currentUser.id)
  );
  const totalTasks = allMyTasks.length;
  const doneTasks = allMyTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allMyTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = allMyTasks.filter(
    (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
  ).length;

  const handleAccept = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    acceptInvitation(teamId, currentUser.id);
    updateCurrentUser({
      ...currentUser,
      activeTeamId: currentUser.activeTeamId ?? teamId,
    });

    // Mark invitation notification as read
    const inviteNotif = notifications.find(
      (n) => n.userId === currentUser.id && n.type === "invitation" && n.meta?.teamId === teamId
    );
    if (inviteNotif) markAsRead(inviteNotif.id);

    // Notify the team leader
    const leader = team.members.find((m) => m.role === "team_leader");
    if (leader) {
      addNotification({
        id: generateId(),
        userId: leader.userId,
        type: "invite_response",
        message: `${currentUser.name} ได้ยอมรับคำเชิญเข้าทีม ${team.name}`,
        read: false,
        createdAt: new Date().toISOString(),
        meta: { teamId, userId: currentUser.id },
      });
    }

    toast.success(`ยอมรับคำเชิญเข้าทีม ${team.name} แล้ว`);
  };

  const handleReject = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    rejectInvitation(teamId, currentUser.id);

    const inviteNotif = notifications.find(
      (n) => n.userId === currentUser.id && n.type === "invitation" && n.meta?.teamId === teamId
    );
    if (inviteNotif) markAsRead(inviteNotif.id);

    toast.success(`ปฏิเสธคำเชิญเข้าทีม ${team.name} แล้ว`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground">ยินดีต้อนรับ, {currentUser.name}</p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            คำเชิญที่รอการตอบรับ
            <Badge variant="destructive">{pendingInvitations.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingInvitations.map((team) => (
              <Card key={team.id} className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.members.length} สมาชิก
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleAccept(team.id)}>
                      ยอมรับ
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReject(team.id)}>
                      ปฏิเสธ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Overall stats */}
      {userTeams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">ภาพรวมงานของฉัน</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <ListTodo className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{doneTasks}</p>
                  <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{inProgressTasks}</p>
                  <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{overdueTasks}</p>
                  <p className="text-xs text-muted-foreground">เกินกำหนด</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Teams with drilldown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">ทีมของฉัน</h2>
        {userTeams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              คุณยังไม่ได้เป็นสมาชิกทีมใด —{" "}
              <Link href="/workspace" className="text-primary hover:underline">
                สร้างทีมใหม่
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userTeams.map((team) => {
              const gt = tasks.filter((t) => t.teamId === team.id);
              const gDone = gt.filter((t) => t.status === "done").length;
              const gOverdue = gt.filter(
                (t) =>
                  t.dueDate &&
                  t.status !== "done" &&
                  new Date(t.dueDate) < new Date()
              ).length;
              const pct = gt.length === 0 ? 0 : Math.round((gDone / gt.length) * 100);
              const myRole = getUserRole(team.id, currentUser.id);
              const roleLabel = myRole === "team_leader" ? "Team Leader" : myRole === "assistant_leader" ? "Asst. Leader" : "Member";

              return (
                <Card
                  key={team.id}
                  className={team.id === currentUser.activeTeamId ? "border-primary" : ""}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {team.name}
                      {team.id === currentUser.activeTeamId && (
                        <Badge variant="default" className="text-xs">กำลังใช้งาน</Badge>
                      )}
                      {gOverdue > 0 && (
                        <Badge variant="destructive" className="text-xs">เกินกำหนด {gOverdue}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                      <p className="text-xs text-muted-foreground">{team.members.length} สมาชิก</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      งาน: {gDone}/{gt.length} ({pct}%)
                    </p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <Link href={`/dashboard/${team.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 h-7 text-xs"
                      >
                        ดูรายละเอียด
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
