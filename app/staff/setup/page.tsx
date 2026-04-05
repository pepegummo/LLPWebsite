"use client";

import { useState } from "react";
import { useGroupStore } from "@/store";
import { Group } from "@/types";
import { GroupTable } from "@/components/staff/GroupTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export default function StaffSetupPage() {
  const { groups, courses, addGroup } = useGroupStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCourse, setNewGroupCourse] = useState("");

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("กรุณากรอกชื่อกลุ่ม");
      return;
    }
    if (!newGroupCourse) {
      toast.error("กรุณาเลือกรายวิชา");
      return;
    }

    const newGroup: Group = {
      id: generateId(),
      courseId: newGroupCourse,
      name: newGroupName.trim(),
      memberIds: [],
      invitedIds: [],
    };

    addGroup(newGroup);
    toast.success(`สร้างกลุ่ม ${newGroupName} แล้ว`);
    setNewGroupName("");
    setNewGroupCourse("");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ตั้งค่ากลุ่ม</h1>
          <p className="text-muted-foreground">จัดการกลุ่มและสมาชิก</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <PlusCircle className="w-4 h-4 mr-2" />
          สร้างกลุ่มใหม่
        </Button>
      </div>

      <GroupTable groups={groups} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างกลุ่มใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ชื่อกลุ่ม</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="ชื่อกลุ่ม..."
              />
            </div>
            <div className="space-y-1">
              <Label>รายวิชา</Label>
              <Select value={newGroupCourse} onValueChange={(v) => setNewGroupCourse(v ?? "")} items={Object.fromEntries(courses.map((c) => [c.id, c.name]))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรายวิชา..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateGroup}>สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
