"use client";

import { use } from "react";
import Link from "next/link";
import { useGroupStore, useTaskStore, useEvaluationStore, useActivityStore } from "@/store";
import { WorkloadBar } from "@/components/student/WorkloadBar";
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
  Star,
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

export default function StaffGroupDashboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { groups } = useGroupStore();
  const { tasks } = useTaskStore();
  const { evaluations } = useEvaluationStore();
  const { getLogsByGroup } = useActivityStore();

  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return (
      <div className="space-y-4">
        <Link href="/staff/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
          </Button>
        </Link>
        <p className="text-muted-foreground">ไม่พบกลุ่มนี้</p>
      </div>
    );
  }

  const groupTasks = tasks.filter((t) => t.groupId === groupId);
  const totalTasks = groupTasks.length;
  const doneTasks = groupTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = groupTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = groupTasks.filter(
    (t) =>
      t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
  ).length;

  const groupEvals = evaluations.filter((e) => e.groupId === groupId);
  const members = mockUsers.filter((u) => group.memberIds.includes(u.id));
  const activityLogs = getLogsByGroup(groupId)
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/staff/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground text-sm">
            {group.memberIds.length} สมาชิก
          </p>
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

      {/* Members */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">สมาชิก</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((member) => {
            const mt = groupTasks.filter((t) => t.assigneeIds.includes(member.id));
            const mDone = mt.filter((t) => t.status === "done").length;
            const mEvals = groupEvals.filter((e) => e.evaluateeId === member.id);
            const avgScore =
              mEvals.length > 0
                ? (mEvals.reduce((s, e) => s + e.score, 0) / mEvals.length).toFixed(1)
                : null;

            return (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        <p>งาน: {mDone}/{mt.length}</p>
                        {avgScore && (
                          <p className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {avgScore} ({mEvals.length} รีวิว)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Workload */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">ภาระงาน</h2>
        <Card>
          <CardContent className="p-4">
            <WorkloadBar tasks={groupTasks} memberIds={group.memberIds} />
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          ประวัติการแก้ไข
        </h2>
        {activityLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              ยังไม่มีประวัติ
            </CardContent>
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
