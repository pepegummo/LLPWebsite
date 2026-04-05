"use client";

import { useAuthStore, useGroupStore, useTaskStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { WorkloadBar } from "@/components/student/WorkloadBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, User, Shuffle } from "lucide-react";
import { toast } from "sonner";

export default function StudentTeamPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();
  const { tasks, updateTask } = useTaskStore();

  if (!currentUser) return null;

  const activeGroup = groups.find((g) => g.id === currentUser.activeGroupId);
  const members = activeGroup
    ? mockUsers.filter((u) => activeGroup.memberIds.includes(u.id))
    : [];

  const groupTasks = tasks.filter((t) => t.groupId === currentUser.activeGroupId);

  const roleLabel = (role: string) => {
    if (role === "professor") return "อาจารย์";
    if (role === "ta") return "TA";
    return "นักศึกษา";
  };

  const handleReassign = () => {
    if (!activeGroup || members.length === 0) return;

    const pendingTasks = groupTasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress"
    );

    if (pendingTasks.length === 0) {
      toast.info("ไม่มีงานที่ต้องจัดสรรใหม่");
      return;
    }

    // Greedy assignment: sort tasks by man hours desc, assign to least loaded member
    const sorted = [...pendingTasks].sort(
      (a, b) => (b.manHours ?? 1) - (a.manHours ?? 1)
    );

    const memberHours: Record<string, number> = {};
    members.forEach((m) => {
      memberHours[m.id] = 0;
    });

    sorted.forEach((task) => {
      const leastLoaded = members.reduce((minId, m) =>
        memberHours[m.id] < memberHours[minId] ? m.id : minId,
        members[0].id
      );
      updateTask({ ...task, assigneeIds: [leastLoaded] });
      memberHours[leastLoaded] += task.manHours ?? 1;
    });

    toast.success(
      `จัดสรรงานใหม่ ${pendingTasks.length} งาน ให้สมาชิก ${members.length} คน`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">ทีมของฉัน</h1>
          {activeGroup && (
            <p className="text-muted-foreground">กลุ่ม: {activeGroup.name}</p>
          )}
        </div>
        {activeGroup && members.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleReassign}>
            <Shuffle className="w-4 h-4 mr-1.5" />
            Re-assign Workload
          </Button>
        )}
      </div>

      {!activeGroup ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีกลุ่มที่ใช้งานอยู่
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Members list */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              สมาชิก ({members.length} คน)
            </h2>
            {members.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  ไม่มีสมาชิก
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => {
                  const memberTasks = groupTasks.filter((t) =>
                    t.assigneeIds.includes(member.id)
                  );
                  const doneTasks = memberTasks.filter(
                    (t) => t.status === "done"
                  ).length;
                  const overdueTasks = memberTasks.filter(
                    (t) =>
                      t.dueDate &&
                      t.status !== "done" &&
                      new Date(t.dueDate) < new Date()
                  ).length;
                  const totalHours = memberTasks.reduce(
                    (s, t) => s + (t.manHours ?? 0),
                    0
                  );

                  return (
                    <Card
                      key={member.id}
                      className={
                        member.id === currentUser.id ? "border-primary" : ""
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="secondary" className="text-xs">
                                {roleLabel(member.role)}
                              </Badge>
                              {member.id === currentUser.id && (
                                <Badge variant="outline" className="text-xs">
                                  คุณ
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                          <p>งานที่รับผิดชอบ: {memberTasks.length}</p>
                          <p>เสร็จสิ้น: {doneTasks}</p>
                          {totalHours > 0 && (
                            <p>Man Hours: {totalHours} ชม.</p>
                          )}
                          {overdueTasks > 0 && (
                            <p className="text-destructive">
                              เกินกำหนด: {overdueTasks}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workload */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">ภาระงาน</h2>
            <Card>
              <CardContent className="p-4">
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">ไม่มีสมาชิก</p>
                ) : (
                  <WorkloadBar
                    tasks={groupTasks}
                    memberIds={activeGroup.memberIds}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
