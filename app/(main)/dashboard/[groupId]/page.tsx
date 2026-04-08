"use client";

import { use } from "react";
import Link from "next/link";
import { useAuthStore, useTaskStore, useTeamStore, useActivityStore } from "@/store";
import { WorkloadBar } from "@/components/WorkloadBar";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  ArrowLeft,
  User,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yy} ${hours}:${mins} ${ampm}`;
}

export default function TeamDashboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId: teamId } = use(params);
  const { currentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { teams } = useTeamStore();
  const { getLogsByTeam } = useActivityStore();

  if (!currentUser) return null;

  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
          </Button>
        </Link>
        <p className="text-muted-foreground">ไม่พบทีมนี้</p>
      </div>
    );
  }

  const memberIds = team.members.map((m) => m.userId);
  const teamTasks = tasks.filter((t) => t.teamId === teamId);
  const totalTasks = teamTasks.length;
  const doneTasks = teamTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = teamTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = teamTasks.filter(
    (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
  ).length;

  const activityLogs = getLogsByTeam(teamId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground text-sm">{team.members.length} สมาชิก</p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Workload */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">ภาระงานสมาชิก</h2>
        <Card>
          <CardContent className="p-4">
            <WorkloadBar tasks={teamTasks} memberIds={memberIds} teamId={teamId} />
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">รายการงาน</h2>
        {teamTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">ยังไม่มีงาน</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {teamTasks.map((task) => {
              const assignees = task.assigneeIds
                .map((id) => mockUsers.find((u) => u.id === id))
                .filter(Boolean);
              const isOverdue =
                task.dueDate &&
                task.status !== "done" &&
                new Date(task.dueDate) < new Date();

              return (
                <Card key={task.id} className={cn(isOverdue && "border-destructive/40")}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-muted-foreground">
                          {assignees.map((a) => (
                            <span key={a!.id} className="flex items-center gap-0.5">
                              <User className="w-3 h-3" />
                              {a!.name}
                            </span>
                          ))}
                          {task.dueDate && (
                            <span className={cn(isOverdue && "text-destructive")}>
                              ครบ {new Date(task.dueDate).toLocaleDateString("th-TH")}
                            </span>
                          )}
                          {task.manHours != null && <span>{task.manHours} ชม.</span>}
                        </div>
                      </div>
                      <Badge
                        variant={task.status === "done" ? "default" : task.status === "in_progress" ? "secondary" : "outline"}
                        className="text-xs shrink-0"
                      >
                        {task.status === "done" ? "เสร็จสิ้น" : task.status === "in_progress" ? "กำลังทำ" : "รอดำเนินการ"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          ประวัติการแก้ไข
        </h2>
        {activityLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">ยังไม่มีประวัติ</CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {activityLogs.map((log) => {
              const user = mockUsers.find((u) => u.id === log.userId);
              return (
                <Card key={log.id}>
                  <CardContent className="p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-medium">{user?.name ?? log.userId}</span>{" "}
                        <span className="text-muted-foreground">{log.action}</span>
                        {log.taskTitle && (
                          <span className="text-muted-foreground">
                            {" "}— <span className="text-foreground">{log.taskTitle}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
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
