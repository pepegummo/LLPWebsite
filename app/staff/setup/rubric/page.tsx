"use client";

import { useState } from "react";
import { useRubricStore, DEFAULT_RUBRIC_WEIGHTS } from "@/store";
import { RubricWeights } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";

const CRITERIA: { key: keyof RubricWeights; label: string; description: string }[] = [
  { key: "contribution", label: "Contribution", description: "การมีส่วนร่วมในการทำงาน" },
  { key: "qualityOfWork", label: "Quality of Work", description: "คุณภาพของงานที่ส่ง" },
  { key: "responsibility", label: "Responsibility", description: "ความรับผิดชอบต่อหน้าที่" },
  { key: "communication", label: "Communication", description: "การสื่อสารและการแสดงความคิดเห็น" },
  { key: "teamwork", label: "Teamwork", description: "การทำงานร่วมกับผู้อื่น" },
  { key: "effort", label: "Effort", description: "ความพยายามและความทุ่มเท" },
];

export default function StaffRubricPage() {
  const { weights, setWeights, resetWeights } = useRubricStore();
  const [draft, setDraft] = useState<RubricWeights>({ ...weights });

  const total = Object.values(draft).reduce((s, v) => s + (v || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const handleChange = (key: keyof RubricWeights, value: string) => {
    const num = parseFloat(value) || 0;
    setDraft((prev) => ({ ...prev, [key]: num }));
  };

  const handleSave = () => {
    if (!isValid) {
      toast.error(`น้ำหนักรวมต้องเท่ากับ 100% (ปัจจุบัน: ${total.toFixed(1)}%)`);
      return;
    }
    setWeights(draft);
    toast.success("บันทึก Rubric แล้ว");
  };

  const handleReset = () => {
    resetWeights();
    setDraft({ ...DEFAULT_RUBRIC_WEIGHTS });
    toast.success("รีเซ็ต Rubric เป็นค่าเริ่มต้นแล้ว");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rubric & Evaluation Setup</h1>
          <p className="text-muted-foreground">
            กำหนดน้ำหนักสำหรับแต่ละหัวข้อในการประเมินเพื่อน
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            รีเซ็ต
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            บันทึก
          </Button>
        </div>
      </div>

      {/* Total indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">น้ำหนักรวม</span>
            <Badge variant={isValid ? "default" : "destructive"} className="text-sm px-3 py-1">
              {total.toFixed(1)}% / 100%
            </Badge>
          </div>
          {!isValid && (
            <p className="text-sm text-destructive mt-2">
              {total < 100
                ? `ยังขาดอีก ${(100 - total).toFixed(1)}%`
                : `เกินมา ${(total - 100).toFixed(1)}%`}
            </p>
          )}
          {/* Visual bar */}
          <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                total > 100 ? "bg-destructive" : isValid ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          <div className="flex gap-1 mt-2 h-2">
            {CRITERIA.map(({ key }, i) => {
              const pct = draft[key] || 0;
              const colors = [
                "bg-blue-500", "bg-green-500", "bg-yellow-500",
                "bg-orange-500", "bg-purple-500", "bg-pink-500",
              ];
              return (
                <div
                  key={key}
                  className={`h-full rounded-sm ${colors[i]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${CRITERIA[i].label}: ${pct}%`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Criteria cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CRITERIA.map(({ key, label, description }, i) => {
          const colors = [
            "border-blue-200 bg-blue-50",
            "border-green-200 bg-green-50",
            "border-yellow-200 bg-yellow-50",
            "border-orange-200 bg-orange-50",
            "border-purple-200 bg-purple-50",
            "border-pink-200 bg-pink-50",
          ];
          const badgeColors = [
            "bg-blue-100 text-blue-700",
            "bg-green-100 text-green-700",
            "bg-yellow-100 text-yellow-700",
            "bg-orange-100 text-orange-700",
            "bg-purple-100 text-purple-700",
            "bg-pink-100 text-pink-700",
          ];

          return (
            <Card key={key} className={colors[i]}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                  <Badge variant="secondary" className={`text-xs ${badgeColors[i]}`}>
                    {draft[key] || 0}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={draft[key] || 0}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={draft[key] || 0}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-20 h-8 text-sm text-right"
                    />
                    <Label className="text-sm text-muted-foreground">%</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview */}
      {isValid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ตัวอย่างการคำนวณคะแนน</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              ตัวอย่าง: นักศึกษาได้รับคะแนน 4/5 ในทุกหัวข้อ
            </p>
            <div className="space-y-1">
              {CRITERIA.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label} ({draft[key]}%)</span>
                  <span>4 × {draft[key] / 100} = {(4 * draft[key] / 100).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between font-semibold text-sm pt-2 border-t">
                <span>คะแนนรวม (weighted)</span>
                <span>
                  {CRITERIA.reduce((s, { key }) => s + 4 * (draft[key] / 100), 0).toFixed(2)} / 5
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
