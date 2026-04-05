"use client";

import { Evaluation } from "@/types";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface EvalResultsTableProps {
  evaluations: Evaluation[];
  groupId: string;
}

export function EvalResultsTable({ evaluations, groupId }: EvalResultsTableProps) {
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
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {evaluateeIds.map((evaluateeId) => {
          const evals = evaluations.filter((e) => e.evaluateeId === evaluateeId);
          const avg = evals.reduce((s, e) => s + e.score, 0) / evals.length;
          const user = mockUsers.find((u) => u.id === evaluateeId);

          return (
            <Card key={evaluateeId}>
              <CardContent className="p-4">
                <p className="font-medium text-sm">{user?.name ?? evaluateeId}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(avg)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold ml-1">
                    {avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({evals.length} การประเมิน)
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed list */}
      <div className="space-y-2">
        {evaluations.map((e) => {
          const evaluator = mockUsers.find((u) => u.id === e.evaluatorId);
          const evaluatee = mockUsers.find((u) => u.id === e.evaluateeId);

          return (
            <Card key={e.id} className="text-sm">
              <CardContent className="p-3">
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <div>
                    <span className="text-muted-foreground">
                      {evaluator?.name ?? e.evaluatorId}
                    </span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium">
                      {evaluatee?.name ?? e.evaluateeId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= e.score
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {e.score}/5
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mt-1">{e.comment}</p>
                <p className="text-xs text-muted-foreground mt-1">
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
