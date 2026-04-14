"use client";

import { useState } from "react";
import { useAuthStore, useTeamStore, useTagStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Tag, Plus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function StudentSetupPage() {
  const { currentUser } = useAuthStore();
  const { teams, getUserRole } = useTeamStore();
  const { addTag, removeTag, getTagsByTeam } = useTagStore();

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

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error("กรุณากรอกชื่อ tag");
      return;
    }
    addTag(activeTeam.id, newTagName.trim(), newTagColor);
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
