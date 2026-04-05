"use client";

import { useAuthStore, useGroupStore, useEvaluationStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { EvaluationForm } from "@/components/student/EvaluationForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export default function StudentEvaluationPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();
  const { evaluations } = useEvaluationStore();

  if (!currentUser) return null;

  const activeGroup = groups.find((g) => g.id === currentUser.activeGroupId);
  const members = activeGroup
    ? mockUsers.filter(
        (u) =>
          activeGroup.memberIds.includes(u.id) && u.id !== currentUser.id
      )
    : [];

  const evaluatedCount = members.filter((m) =>
    evaluations.some(
      (e) => e.evaluatorId === currentUser.id && e.evaluateeId === m.id
    )
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ประเมินเพื่อนร่วมกลุ่ม</h1>
        {activeGroup && (
          <p className="text-muted-foreground">กลุ่ม: {activeGroup.name}</p>
        )}
      </div>

      {!activeGroup ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีกลุ่มที่ใช้งานอยู่
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีสมาชิกในกลุ่มที่สามารถประเมินได้
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>
              ประเมินแล้ว {evaluatedCount}/{members.length} คน
            </span>
            {evaluatedCount === members.length && (
              <Badge variant="default" className="bg-green-500">
                ครบแล้ว!
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <EvaluationForm
                key={member.id}
                evaluatee={member}
                groupId={activeGroup.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
