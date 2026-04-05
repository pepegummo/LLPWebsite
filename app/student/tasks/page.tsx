"use client";

import { useAuthStore, useGroupStore } from "@/store";
import { KanbanBoard } from "@/components/student/KanbanBoard";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentTasksPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();

  if (!currentUser) return null;

  const activeGroup = groups.find((g) => g.id === currentUser.activeGroupId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">กระดาน Kanban</h1>
        {activeGroup && (
          <p className="text-muted-foreground">กลุ่ม: {activeGroup.name}</p>
        )}
      </div>

      {!activeGroup ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">ไม่มีกลุ่มที่ใช้งานอยู่</p>
            <p className="text-sm">กรุณาเลือกกลุ่มจาก Group Switcher หรือรอรับคำเชิญจากอาจารย์/TA</p>
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard groupId={activeGroup.id} />
      )}
    </div>
  );
}
