"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore, useTaskStore, useTeamStore, useActivityStore } from "@/store";
import { useProfileStore } from "@/store/profileStore";
import { useDisplayName } from "@/lib/useDisplayName";
import { WorkloadBar } from "@/components/WorkloadBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  ArrowLeft,
  User,
  History,
  Shuffle,
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
  const { tasks, updateTask } = useTaskStore();
  const { teams } = useTeamStore();
  const { getLogsByTeam } = useActivityStore();
  const { getProfile, fetchProfile } = useProfileStore();
  const resolveDisplayName = useDisplayName();
  const [reassigning, setReassigning] = useState(false);

  // Derive before any conditional return so hooks order stays stable
  const team = teams.find((t) => t.id === teamId);
  const memberIds = team?.members.map((m) => m.userId) ?? [];
  const teamTasks = tasks.filter((t) => t.teamId === teamId);
  const activityLogs = getLogsByTeam(teamId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  useEffect(() => {
    const ids = new Set([
      ...memberIds,
      ...activityLogs.map((l) => l.userId),
    ]);
    ids.forEach((id) => {
      if (!getProfile(id)) fetchProfile(id).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, activityLogs.length]);

  if (!currentUser) return null;
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

  const totalTasks = teamTasks.length;
  const doneTasks = teamTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = teamTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = teamTasks.filter(
    (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
  ).length;

  const handleReassign = async () => {
    if (memberIds.length === 0) return;
    const todoTasks = teamTasks.filter((t) => t.status === "todo");
    if (todoTasks.length === 0) {
      toast.info("ไม่มีงานที่รอดำเนินการให้จัดสมดุล");
      return;
    }

    // Workload = sum of manHours (0 if unset) across ALL tasks per member
    const workload: Record<string, number> = {};
    memberIds.forEach((id) => { workload[id] = 0; });
    teamTasks
      .filter((t) => t.status !== "todo")
      .forEach((t) => {
        t.assigneeIds.forEach((id) => {
          if (id in workload) workload[id] += t.manHours ?? 0;
        });
      });

    // Greedy largest-first: assign todo task to member with lowest workload
    const sorted = [...todoTasks].sort((a, b) => (b.manHours ?? 0) - (a.manHours ?? 0));
    const updates: { id: string; assigneeIds: string[] }[] = [];

    for (const task of sorted) {
      const minId = memberIds.reduce((min, id) =>
        workload[id] < workload[min] ? id : min, memberIds[0]);
      updates.push({ id: task.id, assigneeIds: [minId] });
      workload[minId] += task.manHours ?? 0;
    }

    setReassigning(true);
    try {
      await Promise.all(updates.map((u) => updateTask(u.id, { assigneeIds: u.assigneeIds })));
      toast.success(`จัดสมดุลงาน ${updates.length} รายการเรียบร้อย`);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setReassigning(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ภาระงานสมาชิก</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReassign}
            disabled={reassigning}
          >
            <Shuffle className="w-4 h-4 mr-1.5" />
            {reassigning ? "กำลังจัดสมดุล..." : "จัดสมดุลงาน"}
          </Button>
        </div>
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
                          {task.assigneeIds.map((id) => (
                            <span key={id} className="flex items-center gap-0.5">
                              <User className="w-3 h-3" />
                              {resolveDisplayName(id, id, teamId)}
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
            {activityLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium">
                        {resolveDisplayName(log.userId, log.userId, teamId)}
                      </span>{" "}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
