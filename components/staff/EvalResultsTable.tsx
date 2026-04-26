"use client";

import { Evaluation, EvaluationCriteria } from "@/types";
import { useRubricStore } from "@/store";
import { useProfileStore } from "@/store/profileStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const CRITERIA_LABELS: { key: keyof EvaluationCriteria; label: string }[] = [
  { key: "contribution", label: "Contribution" },
  { key: "qualityOfWork", label: "Quality of Work" },
  { key: "responsibility", label: "Responsibility" },
  { key: "communication", label: "Communication" },
  { key: "teamwork", label: "Teamwork" },
  { key: "effort", label: "Effort" },
];

interface EvalResultsTableProps {
  evaluations: Evaluation[];
  groupId: string;
  teamId?: string;
}

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3 h-3",
            s <= Math.round(score)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}

export function EvalResultsTable({ evaluations, groupId, teamId }: EvalResultsTableProps) {
  const { getWeights } = useRubricStore();
  const { getDisplayName } = useProfileStore();
  const weights = getWeights(groupId);

  const resolveName = (userId: string) =>
    getDisplayName(userId, teamId ?? groupId, userId);

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          ยังไม่มีผลการประเมิน
        </CardContent>
      </Card>
    );
  }

  // Calculate averages per evaluatee
  const evaluateeIds = [...new Set(evaluations.map((e) => e.evaluateeId))];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {evaluateeIds.map((evaluateeId) => {
          const evals = evaluations.filter((e) => e.evaluateeId === evaluateeId);
          const avg = evals.reduce((s, e) => s + e.score, 0) / evals.length;

          // Per-criteria averages
          const criteriaAvgs = CRITERIA_LABELS.map(({ key, label }) => {
            const evalsWithCriteria = evals.filter((e) => e.criteriaScores);
            const avg =
              evalsWithCriteria.length > 0
                ? evalsWithCriteria.reduce(
                    (s, e) => s + (e.criteriaScores![key] ?? 0),
                    0
                  ) / evalsWithCriteria.length
                : null;
            return { key, label, avg };
          });

          return (
            <Card key={evaluateeId}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm">{resolveName(evaluateeId)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <StarRow score={avg} />
                    <span className="text-sm font-semibold ml-1">
                      {avg.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({evals.length} การประเมิน)
                    </span>
                  </div>
                </div>

                {/* Criteria breakdown */}
                {criteriaAvgs.some((c) => c.avg !== null) && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    {criteriaAvgs.map(({ key, label, avg }) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {label}
                          <span className="ml-1 text-muted-foreground/60">({weights[key]}%)</span>
                        </span>
                        {avg !== null ? (
                          <div className="flex items-center gap-1">
                            <StarRow score={avg} />
                            <span className="font-medium w-6 text-right">
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed list */}
      <div className="space-y-2">
        {evaluations.map((e) => {
          const evaluatorName = resolveName(e.evaluatorId);
          const evaluateeName = resolveName(e.evaluateeId);

          return (
            <Card key={e.id} className="text-sm">
              <CardContent className="p-3 space-y-2">
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <div>
                    <span className="text-muted-foreground">{evaluatorName}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium">{evaluateeName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRow score={e.score} />
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {e.score}/5
                    </Badge>
                  </div>
                </div>

                {/* Criteria row */}
                {e.criteriaScores && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs bg-muted/40 rounded px-2 py-1.5">
                    {CRITERIA_LABELS.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground truncate">{label}</span>
                        <span className="font-medium shrink-0">{e.criteriaScores![key]}/5</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-muted-foreground">{e.comment}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.submittedAt).toLocaleString("th-TH")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
