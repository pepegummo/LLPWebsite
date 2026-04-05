"use client";

import Link from "next/link";
import { useAuthStore, useTaskStore, useGroupStore } from "@/store";
import { InvitationCard } from "@/components/student/InvitationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, ListTodo, ChevronRight } from "lucide-react";

export default function StudentDashboardPage() {
  const { currentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { groups } = useGroupStore();

  if (!currentUser) return null;

  // Pending invitations
  const pendingInvitations = groups.filter((g) =>
    g.invitedIds.includes(currentUser.id)
  );

  // User's groups
  const userGroups = groups.filter((g) =>
    g.memberIds.includes(currentUser.id)
  );

  // Overall stats across all groups
  const allMyTasks = tasks.filter((t) =>
    userGroups.some((g) => g.id === t.groupId)
  );
  const totalTasks = allMyTasks.length;
  const doneTasks = allMyTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allMyTasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const overdueTasks = allMyTasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== "done" &&
      new Date(t.dueDate) < new Date()
  ).length;

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
            {pendingInvitations.map((group) => (
              <InvitationCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Overall stats */}
      {userGroups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">ภาพรวมทั้งหมด</h2>
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

      {/* Groups with drilldown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">กลุ่มของฉัน</h2>
        {userGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              คุณยังไม่ได้เป็นสมาชิกกลุ่มใด
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userGroups.map((group) => {
              const gt = tasks.filter((t) => t.groupId === group.id);
              const gDone = gt.filter((t) => t.status === "done").length;
              const gOverdue = gt.filter(
                (t) =>
                  t.dueDate &&
                  t.status !== "done" &&
                  new Date(t.dueDate) < new Date()
              ).length;
              const pct =
                gt.length === 0
                  ? 0
                  : Math.round((gDone / gt.length) * 100);

              return (
                <Card
                  key={group.id}
                  className={
                    group.id === currentUser.activeGroupId
                      ? "border-primary"
                      : ""
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {group.name}
                      {group.id === currentUser.activeGroupId && (
                        <Badge variant="default" className="text-xs">
                          กำลังใช้งาน
                        </Badge>
                      )}
                      {gOverdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          เกินกำหนด {gOverdue}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {group.memberIds.length} สมาชิก
                    </p>
                    <p className="text-xs text-muted-foreground">
                      งาน: {gDone}/{gt.length} ({pct}%)
                    </p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <Link href={`/student/dashboard/${group.id}`}>
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
