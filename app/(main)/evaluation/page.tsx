"use client";

import { useEffect } from "react";
import { useAuthStore, useTeamStore, useEvaluationStore } from "@/store";
import { useProfileStore } from "@/store/profileStore";
import { EvaluationForm } from "@/components/EvaluationForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { User } from "@/types";

export default function StudentEvaluationPage() {
  const { currentUser } = useAuthStore();
  const { teams } = useTeamStore();
  const { evaluations } = useEvaluationStore();
  const { getProfile, fetchProfile } = useProfileStore();

  const activeTeam = currentUser
    ? teams.find((t) => t.id === currentUser.activeTeamId)
    : undefined;

  const memberIds = activeTeam
    ? activeTeam.members
        .map((m) => m.userId)
        .filter((id) => id !== currentUser?.id)
    : [];

  // Fetch profiles for all team members
  useEffect(() => {
    memberIds.forEach((id) => {
      if (!getProfile(id)) fetchProfile(id).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam?.id]);

  if (!currentUser) return null;

  // Build User objects from real profiles
  const members: User[] = memberIds.map((id) => {
    const profile = getProfile(id);
    const name = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
        profile.name ||
        id
      : id;
    return { id, name };
  });

  const evaluatedCount = members.filter((m) =>
    evaluations.some(
      (e) => e.evaluatorId === currentUser.id && e.evaluateeId === m.id
    )
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ประเมินเพื่อนร่วมทีม</h1>
        {activeTeam && (
          <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
        )}
      </div>

      {!activeTeam ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีทีมที่ใช้งานอยู่
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีสมาชิกในทีมที่สามารถประเมินได้
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
                teamId={activeTeam.id}
                workspaceId={activeTeam.workspaceId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
