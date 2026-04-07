"use client";

import { useAuthStore, useTeamStore } from "@/store";
import { KanbanBoard } from "@/components/student/KanbanBoard";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentTasksPage() {
  const { currentUser } = useAuthStore();
  const { teams } = useTeamStore();

  if (!currentUser) return null;

  const activeTeam = teams.find((t) => t.id === currentUser.activeTeamId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">กระดาน Kanban</h1>
        {activeTeam && (
          <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
        )}
      </div>

      {!activeTeam ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">ไม่มีทีมที่ใช้งานอยู่</p>
            <p className="text-sm">กรุณาเลือกทีมจาก Team Switcher หรือสร้างทีมใหม่</p>
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard teamId={activeTeam.id} />
      )}
    </div>
  );
}
