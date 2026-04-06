"use client";

import { useState } from "react";
import { Task, TaskStatus, Attachment, SubTask } from "@/types";
import { useGroupStore, useAuthStore, useNotificationStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PlusCircle, Trash2, Link, CheckSquare, Square, Clock, ChevronDown, ChevronUp, Users } from "lucide-react";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  initialTask?: Task;
  groupId: string;
}

export function TaskForm({
  open,
  onClose,
  onSave,
  initialTask,
  groupId,
}: TaskFormProps) {
  const { groups } = useGroupStore();
  const { currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const group = groups.find((g) => g.id === groupId);
  const members = group
    ? mockUsers.filter((u) => group.memberIds.includes(u.id))
    : [];

  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(
    initialTask?.description ?? ""
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status ?? "todo"
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initialTask?.assigneeIds ?? []
  );
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? "");
  const [manHours, setManHours] = useState<string>(
    initialTask?.manHours?.toString() ?? ""
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialTask?.attachments ?? []
  );
  const [attachLabel, setAttachLabel] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    initialTask?.subTasks ?? []
  );
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [expandedSubTask, setExpandedSubTask] = useState<string | null>(null);

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSubTaskAssignee = (subTaskId: string, userId: string) => {
    setSubTasks((prev) =>
      prev.map((st) => {
        if (st.id !== subTaskId) return st;
        const currentIds = st.assigneeIds ?? [];
        return {
          ...st,
          assigneeIds: currentIds.includes(userId)
            ? currentIds.filter((id) => id !== userId)
            : [...currentIds, userId],
        };
      })
    );
  };

  const handleAddAttachment = () => {
    if (!attachLabel.trim() || !attachUrl.trim()) {
      toast.error("กรุณากรอกชื่อและ URL");
      return;
    }
    setAttachments((prev) => [
      ...prev,
      {
        id: generateId(),
        label: attachLabel.trim(),
        url: normalizeUrl(attachUrl.trim()),
      },
    ]);
    setAttachLabel("");
    setAttachUrl("");
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    setSubTasks((prev) => [
      ...prev,
      { id: generateId(), title: newSubTaskTitle.trim(), completed: false, manHours: undefined, assigneeIds: [] },
    ]);
    setNewSubTaskTitle("");
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks((prev) => prev.filter((st) => st.id !== id));
    if (expandedSubTask === id) setExpandedSubTask(null);
  };

  const handleUpdateSubTaskHours = (id: string, value: string) => {
    setSubTasks((prev) =>
      prev.map((st) =>
        st.id === id
          ? { ...st, manHours: value ? parseFloat(value) : undefined }
          : st
      )
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("กรุณากรอกชื่องาน");
      return;
    }

    const prevAssigneeIds = initialTask?.assigneeIds ?? [];
    const newlyAssigned = assigneeIds.filter(
      (id) => !prevAssigneeIds.includes(id)
    );

    const subtaskHoursSum = subTasks.reduce((s, st) => s + (st.manHours ?? 0), 0);
    const task: Task = {
      id: initialTask?.id ?? generateId(),
      groupId,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      assigneeIds,
      attachments,
      dueDate: dueDate || null,
      createdAt: initialTask?.createdAt ?? new Date().toISOString(),
      manHours:
        subTasks.length > 0
          ? subtaskHoursSum > 0 ? subtaskHoursSum : null
          : manHours ? parseFloat(manHours) : null,
      subTasks,
    };

    // Send notification to each newly assigned member
    newlyAssigned.forEach((userId) => {
      addNotification({
        id: generateId(),
        userId,
        type: "task_assigned",
        message: `คุณได้รับมอบหมายงาน: ${task.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        meta: { taskId: task.id, groupId },
      });
    });

    onSave(task);
    onClose();
  };

  const handleClose = () => {
    if (!initialTask) {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setAssigneeIds([]);
      setDueDate("");
      setManHours("");
      setAttachments([]);
      setSubTasks([]);
      setExpandedSubTask(null);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialTask ? "แก้ไขงาน" : "เพิ่มงานใหม่"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="task-title">ชื่องาน *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่องาน..."
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="task-desc">รายละเอียด</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดงาน..."
              rows={3}
            />
          </div>

          {/* Status + Man Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>สถานะ</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v as TaskStatus);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">รอดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="done">เสร็จสิ้น</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="man-hours">Man Hours</Label>
              {subTasks.length > 0 ? (
                <div className="flex items-center gap-1.5 h-9 px-3 bg-muted rounded-md text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {subTasks.reduce((s, st) => s + (st.manHours ?? 0), 0)} ชม.
                    <span className="text-xs ml-1">(รวมจาก sub-tasks)</span>
                  </span>
                </div>
              ) : (
                <Input
                  id="man-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={manHours}
                  onChange={(e) => setManHours(e.target.value)}
                  placeholder="จำนวนชั่วโมง"
                />
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <Label htmlFor="due-date">วันครบกำหนด</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Assignees (checkboxes) */}
          <div className="space-y-2">
            <Label>ผู้รับผิดชอบ (task หลัก)</Label>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีสมาชิกในกลุ่ม</p>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {members.map((m) => {
                  const checked = assigneeIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        checked
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-tasks */}
          <div className="space-y-2">
            <Label>Sub-tasks</Label>
            {subTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มี sub-task</p>
            )}
            {subTasks.map((st) => (
              <div key={st.id} className="border border-border rounded-md overflow-hidden">
                {/* Sub-task header row */}
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5">
                  <span className="flex-1 text-sm truncate">{st.title}</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={st.manHours?.toString() ?? ""}
                    onChange={(e) => handleUpdateSubTaskHours(st.id, e.target.value)}
                    placeholder="ชม."
                    className="w-20 h-7 text-xs px-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSubTask((prev) => (prev === st.id ? null : st.id))
                    }
                    className="text-muted-foreground hover:text-foreground"
                    title="กำหนดผู้รับผิดชอบ sub-task"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  {expandedSubTask === st.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleRemoveSubTask(st.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>

                {/* Sub-task assignees (expandable) */}
                {expandedSubTask === st.id && (
                  <div className="px-3 py-2 space-y-1 bg-background">
                    <p className="text-xs text-muted-foreground mb-1">
                      ผู้รับผิดชอบ sub-task:
                    </p>
                    {members.map((m) => {
                      const checked = (st.assigneeIds ?? []).includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleSubTaskAssignee(st.id, m.id)}
                          className={`flex items-center gap-2 px-2 py-1 rounded text-xs w-full text-left transition-colors ${
                            checked
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted border border-transparent"
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="ชื่อ sub-task..."
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubTask();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddSubTask}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>ไฟล์แนบ / ลิงก์</Label>
            {attachments.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
            )}
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5"
              >
                <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {att.url}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleRemoveAttachment(att.id)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="ชื่อลิงก์"
                value={attachLabel}
                onChange={(e) => setAttachLabel(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="URL (เช่น google.com)"
                value={attachUrl}
                onChange={(e) => setAttachUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAttachment();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddAttachment}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
