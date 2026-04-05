"use client";

import { Group, Task } from "@/types";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ProgressReportCardProps {
  group: Group;
  tasks: Task[];
}

export function ProgressReportCard({ group, tasks }: ProgressReportCardProps) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const pct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== "done" &&
      new Date(t.dueDate) < new Date()
  );

  const members = mockUsers.filter((u) => group.memberIds.includes(u.id));

  return (
    <Card className={overdueTasks.length > 0 ? "border-destructive/40" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {group.name}
            {overdueTasks.length > 0 && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                เกินกำหนด {overdueTasks.length}
              </Badge>
            )}
            <Badge variant={pct === 100 ? "default" : "secondary"} className={`text-xs ${pct === 100 ? "bg-green-500" : ""}`}>
              {pct}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>ความคืบหน้า</span>
            <span>
              {doneTasks}/{totalTasks} งาน
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct === 100 ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-wrap gap-1">
          {members.map((m) => (
            <span
              key={m.id}
              className="text-xs bg-muted rounded-full px-2 py-0.5"
            >
              {m.name}
            </span>
          ))}
        </div>

        {/* Task status summary */}
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div className="bg-muted rounded-md p-2">
            <p className="font-semibold">
              {tasks.filter((t) => t.status === "todo").length}
            </p>
            <p className="text-muted-foreground">รอดำเนินการ</p>
          </div>
          <div className="bg-blue-50 rounded-md p-2">
            <p className="font-semibold">
              {tasks.filter((t) => t.status === "in_progress").length}
            </p>
            <p className="text-muted-foreground">กำลังดำเนินการ</p>
          </div>
          <div className="bg-green-50 rounded-md p-2">
            <p className="font-semibold text-green-700">{doneTasks}</p>
            <p className="text-muted-foreground">เสร็จสิ้น</p>
          </div>
        </div>

        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-destructive">
              งานที่เกินกำหนด:
            </p>
            {overdueTasks.map((t) => {
              const assignee =
                t.assigneeIds.length > 0
                  ? mockUsers.find((u) => u.id === t.assigneeIds[0])
                  : null;
              return (
                <div
                  key={t.id}
                  className="text-xs text-muted-foreground flex items-center gap-2"
                >
                  <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                  <span>
                    {t.title}
                    {assignee && ` (${assignee.name})`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
