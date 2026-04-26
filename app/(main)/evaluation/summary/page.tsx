"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore, useTeamStore, useEvaluationStore } from "@/store";
import { useRubricStore } from "@/store/rubricStore";
import { useProfileStore } from "@/store/profileStore";
import { EvalResultsTable } from "@/components/staff/EvalResultsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star } from "lucide-react";

export default function EvaluationSummaryPage() {
  const { currentUser } = useAuthStore();
  const { teams } = useTeamStore();
  const { evaluations, fetchEvaluations } = useEvaluationStore();
  const { fetchRubric } = useRubricStore();
  const { getProfile, fetchProfile } = useProfileStore();

  const activeTeam = currentUser
    ? teams.find((t) => t.id === currentUser.activeTeamId)
    : undefined;

  const teamEvaluations = activeTeam
    ? evaluations.filter((e) => e.teamId === activeTeam.id)
    : [];

  useEffect(() => {
    if (!activeTeam) return;
    fetchEvaluations(activeTeam.id).catch(() => {});
    fetchRubric(activeTeam.workspaceId).catch(() => {});
  }, [activeTeam?.id]);

  useEffect(() => {
    const userIds = [
      ...new Set([
        ...teamEvaluations.map((e) => e.evaluatorId),
        ...teamEvaluations.map((e) => e.evaluateeId),
      ]),
    ];
    userIds.forEach((id) => {
      if (!getProfile(id)) fetchProfile(id).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamEvaluations.length]);

  if (!currentUser) return null;

  const memberCount = activeTeam
    ? activeTeam.members.filter((m) => m.userId !== currentUser.id).length
    : 0;

  const evaluateeIds = [...new Set(teamEvaluations.map((e) => e.evaluateeId))];
  const avgOverall =
    teamEvaluations.length > 0
      ? teamEvaluations.reduce((s, e) => s + e.score, 0) / teamEvaluations.length
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/evaluation">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">ภาพรวมผลการประเมิน</h1>
          {activeTeam && (
            <p className="text-muted-foreground text-sm">ทีม: {activeTeam.name}</p>
          )}
        </div>
      </div>

      {!activeTeam ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีทีมที่ใช้งานอยู่
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{teamEvaluations.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">การประเมินทั้งหมด</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{evaluateeIds.length}/{memberCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">สมาชิกที่ถูกประเมิน</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <p className="text-2xl font-bold">
                    {avgOverall !== null ? avgOverall.toFixed(2) : "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">คะแนนเฉลี่ยรวม</p>
              </CardContent>
            </Card>
          </div>

          <EvalResultsTable
            evaluations={teamEvaluations}
            groupId={activeTeam.workspaceId}
            teamId={activeTeam.id}
          />
        </>
      )}
    </div>
  );
}
