"use client";

import { useState } from "react";
import { useAuthStore, useTeamStore, useRubricStore, useTagStore } from "@/store";
import { DEFAULT_RUBRIC_WEIGHTS } from "@/store/rubricStore";
import { RubricWeights } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Tag, Sliders, RotateCcw, Plus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const CRITERIA_LABELS: { key: keyof RubricWeights; label: string }[] = [
  { key: "contribution", label: "Contribution (การมีส่วนร่วม)" },
  { key: "qualityOfWork", label: "Quality of Work (คุณภาพงาน)" },
  { key: "responsibility", label: "Responsibility (ความรับผิดชอบ)" },
  { key: "communication", label: "Communication (การสื่อสาร)" },
  { key: "teamwork", label: "Teamwork (การทำงานเป็นทีม)" },
  { key: "effort", label: "Effort (ความพยายาม)" },
];

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function StudentSetupPage() {
  const { currentUser } = useAuthStore();
  const { teams, getUserRole } = useTeamStore();
  const { weights, setWeights, resetWeights } = useRubricStore();
  const { addTag, removeTag, getTagsByTeam } = useTagStore();

  const [localWeights, setLocalWeights] = useState<RubricWeights>({ ...weights });
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  if (!currentUser) return null;

  const activeTeam = teams.find((t) => t.id === currentUser.activeTeamId);
  const userRole = activeTeam
    ? getUserRole(activeTeam.id, currentUser.id)
    : null;
  const isLeader = userRole === "team_leader" || userRole === "assistant_leader";

  if (!isLeader) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          ตั้งค่าทีม
        </h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>เฉพาะ Team Leader หรือ Assistant Leader เท่านั้นที่สามารถเข้าถึงหน้านี้</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ตั้งค่าทีม</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีทีมที่ใช้งานอยู่ — เลือกทีมจาก Team Switcher
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamTags = getTagsByTeam(activeTeam.id);

  const totalWeight = Object.values(localWeights).reduce((s, v) => s + v, 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (key: keyof RubricWeights, value: string) => {
    const num = parseInt(value) || 0;
    setLocalWeights((prev) => ({ ...prev, [key]: num }));
  };

  const handleSaveWeights = () => {
    if (!isWeightValid) {
      toast.error(`น้ำหนักรวมต้องเท่ากับ 100 (ปัจจุบัน: ${totalWeight})`);
      return;
    }
    setWeights(localWeights);
    toast.success("บันทึกค่าน้ำหนัก Rubric แล้ว");
  };

  const handleResetWeights = () => {
    setLocalWeights({ ...DEFAULT_RUBRIC_WEIGHTS });
    resetWeights();
    toast.success("รีเซ็ตค่าน้ำหนักแล้ว");
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error("กรุณากรอกชื่อ tag");
      return;
    }
    addTag({
      id: generateId(),
      teamId: activeTeam.id,
      name: newTagName.trim(),
      color: newTagColor,
    });
    setNewTagName("");
    toast.success(`เพิ่ม tag "${newTagName.trim()}" แล้ว`);
  };

  const handleDeleteTag = (tagId: string) => {
    removeTag(tagId);
    toast.success("ลบ tag แล้ว");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          ตั้งค่าทีม
        </h1>
        <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
      </div>

      {/* Rubric Weights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            ค่าน้ำหนัก Rubric การประเมิน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            กำหนดน้ำหนัก (%) สำหรับแต่ละเกณฑ์การประเมิน — ผลรวมต้องเท่ากับ 100
          </p>

          <div className="space-y-3">
            {CRITERIA_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Label className="flex-1 text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={localWeights[key]}
                    onChange={(e) => handleWeightChange(key, e.target.value)}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground w-4">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className={cn(
            "flex items-center justify-between p-3 rounded-md text-sm",
            isWeightValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            <span>ผลรวมน้ำหนัก</span>
            <span className="font-semibold">{totalWeight}%</span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleResetWeights}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              รีเซ็ต
            </Button>
            <Button size="sm" onClick={handleSaveWeights} disabled={!isWeightValid}>
              บันทึกน้ำหนัก
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4" />
            จัดการ Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tags ใช้สำหรับจัดหมวดหมู่งานใน Kanban Board
          </p>

          {/* Existing tags */}
          {teamTags.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">ยังไม่มี tag</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teamTags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1 group">
                  <span
                    className="rounded-full px-3 py-1 text-xs text-white font-medium"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new tag */}
          <div className="border-t border-border pt-3 space-y-2">
            <Label className="text-sm">เพิ่ม Tag ใหม่</Label>
            <div className="flex gap-2">
              <Input
                placeholder="ชื่อ tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
                }}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddTag}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                เพิ่ม
              </Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    newTagColor === color && "ring-2 ring-offset-2 ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {newTagName && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">ตัวอย่าง:</span>
                <span
                  className="rounded-full px-3 py-1 text-xs text-white"
                  style={{ backgroundColor: newTagColor }}
                >
                  {newTagName}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
