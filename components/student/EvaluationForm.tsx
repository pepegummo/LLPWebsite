"use client";

import { useState } from "react";
import { Evaluation } from "@/types";
import { useEvaluationStore, useAuthStore } from "@/store";
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

interface EvaluationFormProps {
  evaluatee: User;
  groupId: string;
}

export function EvaluationForm({ evaluatee, groupId }: EvaluationFormProps) {
  const { currentUser } = useAuthStore();
  const { addEvaluation, updateEvaluation, hasEvaluated, evaluations } =
    useEvaluationStore();

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
  const [score, setScore] = useState<number>(existingEval?.score ?? 0);
  const [comment, setComment] = useState(existingEval?.comment ?? "");
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = () => {
    if (!currentUser) return;
    if (score === 0) {
      toast.error("กรุณาให้คะแนน");
      return;
    }
    if (!comment.trim()) {
      toast.error("กรุณาเขียนความคิดเห็น");
      return;
    }

    if (isEditing && existingEval) {
      updateEvaluation({
        ...existingEval,
        score: score as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim(),
        submittedAt: new Date().toISOString(),
      });
      toast.success(`แก้ไขการประเมิน ${evaluatee.name} แล้ว`);
      setIsEditing(false);
    } else {
      const evaluation: Evaluation = {
        id: generateId(),
        groupId,
        evaluatorId: currentUser.id,
        evaluateeId: evaluatee.id,
        score: score as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim(),
        submittedAt: new Date().toISOString(),
      };
      addEvaluation(evaluation);
      toast.success(`ประเมิน ${evaluatee.name} แล้ว`);
    }
  };

  if (alreadyEvaluated && existingEval && !isEditing) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            {evaluatee.name}
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-700"
            >
              ประเมินแล้ว
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "w-4 h-4",
                  s <= existingEval.score
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{existingEval.comment}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-1"
            onClick={() => {
              setScore(existingEval.score);
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

  return (
    <Card className={isEditing ? "border-primary/40" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {evaluatee.name}
          {isEditing && (
            <Badge variant="outline" className="text-xs">
              กำลังแก้ไข
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">คะแนน</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoveredStar(s)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setScore(s)}
                className="focus:outline-none"
              >
                <Star
                  className={cn(
                    "w-6 h-6 transition-colors",
                    s <= (hoveredStar || score)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">ความคิดเห็น</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            rows={2}
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
