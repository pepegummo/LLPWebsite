"use client";

import { Task } from "@/types";
import { mockUsers } from "@/lib/mockData";
import { useDisplayName } from "@/lib/useDisplayName";

interface WorkloadBarProps {
  tasks: Task[];
  memberIds: string[];
  teamId?: string;
}

export function WorkloadBar({ tasks, memberIds, teamId }: WorkloadBarProps) {
  const resolveDisplayName = useDisplayName();
  const members = mockUsers.filter((u) => memberIds.includes(u.id));

  if (members.length === 0) return null;

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const memberTasks = tasks.filter((t) => t.assigneeIds.includes(member.id));
        const doneTasks = memberTasks.filter((t) => t.status === "done");
        const totalHours = memberTasks.reduce(
          (sum, t) => sum + (t.manHours ?? 1),
          0
        );
        const doneHours = doneTasks.reduce(
          (sum, t) => sum + (t.manHours ?? 1),
          0
        );
        const pct =
          memberTasks.length === 0
            ? 0
            : Math.round((doneTasks.length / memberTasks.length) * 100);

        return (
          <div key={member.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{resolveDisplayName(member.id, member.name, teamId)}</span>
              <span className="text-muted-foreground text-xs">
                {doneTasks.length}/{memberTasks.length} งาน ({pct}%)
                {totalHours > 0 && (
                  <span className="ml-1">· {doneHours}/{totalHours} ชม.</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
