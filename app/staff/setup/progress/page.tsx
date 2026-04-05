"use client";

import { useGroupStore, useTaskStore } from "@/store";
import { ProgressReportCard } from "@/components/staff/ProgressReportCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export default function StaffProgressPage() {
  const { groups } = useGroupStore();
  const { tasks } = useTaskStore();

  const groupsWithOverdue = groups.filter((g) =>
    tasks.some(
      (t) =>
        t.groupId === g.id &&
        t.dueDate &&
        t.status !== "done" &&
        new Date(t.dueDate) < new Date()
    )
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          รายงานความคืบหน้า
        </h1>
        <p className="text-muted-foreground">
          ดูความคืบหน้าของทุกกลุ่มแบบอ่านอย่างเดียว
        </p>
      </div>

      {groupsWithOverdue.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm font-medium text-destructive flex items-center gap-2">
            มี {groupsWithOverdue.length} กลุ่มที่มีงานเกินกำหนด:
            {groupsWithOverdue.map((g) => (
              <Badge key={g.id} variant="destructive" className="text-xs">
                {g.name}
              </Badge>
            ))}
          </p>
        </div>
      )}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีกลุ่ม
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map((group) => (
            <ProgressReportCard
              key={group.id}
              group={group}
              tasks={tasks.filter((t) => t.groupId === group.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
