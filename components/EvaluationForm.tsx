"use client";

import { useState } from "react";
import { Evaluation, EvaluationCriteria } from "@/types";
import { useEvaluationStore, useAuthStore, useRubricStore } from "@/store";
import { useDisplayName } from "@/lib/useDisplayName";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, CheckCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const CRITERIA_LABELS: { key: keyof EvaluationCriteria; label: string }[] = [
  { key: "contribution", label: "Contribution (การมีส่วนร่วม)" },
  { key: "qualityOfWork", label: "Quality of Work (คุณภาพงาน)" },
  { key: "responsibility", label: "Responsibility (ความรับผิดชอบ)" },
  { key: "communication", label: "Communication (การสื่อสาร)" },
  { key: "teamwork", label: "Teamwork (การทำงานเป็นทีม)" },
  { key: "effort", label: "Effort (ความพยายาม)" },
];

function computeWeightedScore(
  criteria: EvaluationCriteria,
  weights: Record<keyof EvaluationCriteria, number>
): 1 | 2 | 3 | 4 | 5 {
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0) || 100;
  const weighted = CRITERIA_LABELS.reduce((s, { key }) => {
    return s + (criteria[key] * weights[key]) / totalWeight;
  }, 0);
  return Math.min(5, Math.max(1, Math.round(weighted))) as 1 | 2 | 3 | 4 | 5;
}

function CriteriaStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              s <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface EvaluationFormProps {
  evaluatee: User;
  teamId: string;
}

const EMPTY_CRITERIA: EvaluationCriteria = {
  contribution: 0,
  qualityOfWork: 0,
  responsibility: 0,
  communication: 0,
  teamwork: 0,
  effort: 0,
};

export function EvaluationForm({ evaluatee, teamId }: EvaluationFormProps) {
  const { currentUser } = useAuthStore();
  const { addEvaluation, updateEvaluation, hasEvaluated, evaluations } =
    useEvaluationStore();
  const { weights } = useRubricStore();
  const resolveDisplayName = useDisplayName();
  const evaluateeName = resolveDisplayName(evaluatee.id, evaluatee.name, teamId);

  const alreadyEvaluated = currentUser
    ? hasEvaluated(currentUser.id, evaluatee.id)
    : false;

  const existingEval = currentUser
    ? evaluations.find(
        (e) =>
          e.evaluatorId === currentUser.id && e.evaluateeId === evaluatee.id
      )
    : null;

  const [isEditing, setIsEditing] = useState(false);
  const [criteria, setCriteria] = useState<EvaluationCriteria>(
    existingEval?.criteriaScores ?? { ...EMPTY_CRITERIA }
  );
  const [comment, setComment] = useState(existingEval?.comment ?? "");

  const updateCriterion = (key: keyof EvaluationCriteria, value: number) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
  };

  const allRated = CRITERIA_LABELS.every(({ key }) => criteria[key] > 0);

  const handleSubmit = () => {
    if (!currentUser) return;
    if (!allRated) {
      toast.error("กรุณาให้คะแนนทุกหัวข้อ");
      return;
    }
    if (!comment.trim()) {
      toast.error("กรุณาเขียนความคิดเห็น");
      return;
    }

    const score = computeWeightedScore(criteria, weights);

    if (isEditing && existingEval) {
      updateEvaluation({
        ...existingEval,
        score,
        criteriaScores: criteria,
        comment: comment.trim(),
        submittedAt: new Date().toISOString(),
      });
      toast.success(`แก้ไขการประเมิน ${evaluateeName} แล้ว`);
      setIsEditing(false);
    } else {
      const evaluation: Evaluation = {
        id: generateId(),
        teamId,
        evaluatorId: currentUser.id,
        evaluateeId: evaluatee.id,
        score,
        criteriaScores: criteria,
        comment: comment.trim(),
        submittedAt: new Date().toISOString(),
      };
      addEvaluation(evaluation);
      toast.success(`ประเมิน ${evaluateeName} แล้ว`);
    }
  };

  if (alreadyEvaluated && existingEval && !isEditing) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            {evaluateeName}
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-700"
            >
              ประเมินแล้ว
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {existingEval.criteriaScores && (
            <div className="space-y-1">
              {CRITERIA_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">{label}</span>
                  <div className="flex gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-3 h-3",
                          s <= existingEval.criteriaScores![key]
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 pt-1 border-t border-green-200">
            <span className="text-xs text-muted-foreground">คะแนนรวม:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3.5 h-3.5",
                    s <= existingEval.score
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold">{existingEval.score}/5</span>
          </div>
          <p className="text-sm text-muted-foreground">{existingEval.comment}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-1"
            onClick={() => {
              setCriteria(existingEval.criteriaScores ?? { ...EMPTY_CRITERIA });
              setComment(existingEval.comment);
              setIsEditing(true);
            }}
          >
            <Pencil className="w-3 h-3 mr-1.5" />
            แก้ไขการประเมิน
          </Button>
        </CardContent>
      </Card>
    );
  }

  const previewScore = allRated ? computeWeightedScore(criteria, weights) : null;

  return (
    <Card className={isEditing ? "border-primary/40" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {evaluateeName}
          {isEditing && (
            <Badge variant="outline" className="text-xs">
              กำลังแก้ไข
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Criteria */}
        <div className="space-y-3">
          {CRITERIA_LABELS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <span className="text-xs text-muted-foreground">
                  {weights[key]}%
                </span>
              </div>
              <CriteriaStars
                value={criteria[key]}
                onChange={(v) => updateCriterion(key, v)}
              />
            </div>
          ))}
        </div>

        {/* Preview score */}
        {previewScore !== null && (
          <div className="flex items-center gap-2 py-2 px-3 bg-muted rounded-md">
            <span className="text-xs text-muted-foreground">คะแนนรวม (weighted):</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3.5 h-3.5",
                    s <= previewScore
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold">{previewScore}/5</span>
          </div>
        )}

        {/* Comment */}
        <div className="space-y-1.5 border-t border-border pt-3">
          <Label className="text-xs">ความคิดเห็น *</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            rows={3}
            className="text-sm"
          />
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditing(false)}
            >
              ยกเลิก
            </Button>
          )}
          <Button size="sm" onClick={handleSubmit} className="flex-1">
            {isEditing ? "บันทึกการแก้ไข" : "ส่งการประเมิน"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
