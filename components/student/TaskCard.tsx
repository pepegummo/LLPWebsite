"use client";

import { useState } from "react";
import { Task, TaskStatus } from "@/types";
import { useTaskStore, useAuthStore, useActivityStore, useTagStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { TaskForm } from "./TaskForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  ExternalLink,
  GripVertical,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yy} ${hours}:${mins} ${ampm}`;
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask, moveTask, toggleSubTask } = useTaskStore();
  const { currentUser } = useAuthStore();
  const { addLog, getLogsByTask } = useActivityStore();
  const { getTagsByGroup } = useTagStore();
  const taskTags = getTagsByGroup(task.groupId).filter((t) =>
    (task.tags ?? []).includes(t.id)
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignees = task.assigneeIds
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter(Boolean) as (typeof mockUsers)[0][];

  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) < new Date();

  const hasSubTasks = task.subTasks.length > 0;
  const completedSubTasks = task.subTasks.filter((st) => st.completed).length;

  const handleDelete = () => {
    deleteTask(task.id);
    if (currentUser) {
      addLog({
        id: Math.random().toString(36).substring(2, 11),
        taskId: task.id,
        taskTitle: task.title,
        groupId: task.groupId,
        userId: currentUser.id,
        action: "ลบงาน",
        timestamp: new Date().toISOString(),
      });
    }
    toast.success("ลบงานแล้ว");
    setDeleteOpen(false);
  };

  const handleStatusChange = (newStatus: string | null) => {
    if (!newStatus) return;
    if (newStatus === "done" && hasSubTasks && completedSubTasks < task.subTasks.length) {
      toast.error("ต้องทำ sub-task ให้ครบก่อนถึงจะ mark เสร็จสิ้นได้");
      return;
    }
    const oldLabel = statusLabel(task.status);
    const newLabel = statusLabel(newStatus as TaskStatus);
    moveTask(task.id, newStatus as TaskStatus);
    if (currentUser) {
      addLog({
        id: Math.random().toString(36).substring(2, 11),
        taskId: task.id,
        taskTitle: task.title,
        groupId: task.groupId,
        userId: currentUser.id,
        action: `เปลี่ยนสถานะ: ${oldLabel} → ${newLabel}`,
        timestamp: new Date().toISOString(),
      });
    }
    toast.success("อัปเดตสถานะแล้ว");
  };

  const handleToggleSubTask = (subTaskId: string) => {
    const subTask = task.subTasks.find((st) => st.id === subTaskId);
    if (!subTask) return;
    toggleSubTask(task.id, subTaskId);
    if (currentUser) {
      addLog({
        id: Math.random().toString(36).substring(2, 11),
        taskId: task.id,
        taskTitle: task.title,
        groupId: task.groupId,
        userId: currentUser.id,
        action: `${subTask.completed ? "ยกเลิก" : "ทำเสร็จ"} sub-task: ${subTask.title}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const statusLabel = (status: TaskStatus) => {
    if (status === "done") return "เสร็จสิ้น";
    if (status === "in_progress") return "กำลังดำเนินการ";
    return "รอดำเนินการ";
  };

  const activityLogs = getLogsByTask(task.id).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const logUserName = (userId: string) =>
    mockUsers.find((u) => u.id === userId)?.name ?? userId;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "mb-2 cursor-default select-none",
          isDragging && "opacity-50 shadow-lg",
          isOverdue && "border-destructive/50"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-snug">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}

              {taskTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {taskTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-0.5 text-[10px] text-white leading-none"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-2">
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-6 text-xs w-auto px-2 py-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">รอดำเนินการ</SelectItem>
                    <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="done">เสร็จสิ้น</SelectItem>
                  </SelectContent>
                </Select>

                {isOverdue && (
                  <Badge variant="destructive" className="text-xs h-6">
                    เกินกำหนด
                  </Badge>
                )}

                {hasSubTasks && (
                  <Badge variant="outline" className="text-xs h-6">
                    {completedSubTasks}/{task.subTasks.length} subtask
                  </Badge>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {assignees.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {assignees.map((a) => a.name).join(", ")}
                  </span>
                )}
                {task.manHours != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.manHours} ชม.
                  </span>
                )}
                {task.dueDate && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isOverdue && "text-destructive"
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString("th-TH")}
                  </span>
                )}
              </div>

              {/* Sub-tasks */}
              {hasSubTasks && (
                <div className="mt-2 space-y-1.5">
                  {task.subTasks.map((st) => {
                    const subAssignees = (st.assigneeIds ?? [])
                      .map((id) => mockUsers.find((u) => u.id === id))
                      .filter(Boolean) as (typeof mockUsers)[0][];
                    return (
                      <div key={st.id}>
                        <button
                          type="button"
                          onClick={() => handleToggleSubTask(st.id)}
                          className="flex items-center gap-1.5 text-xs w-full text-left hover:text-foreground text-muted-foreground"
                        >
                          {st.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className={cn("flex-1", st.completed && "line-through")}>
                            {st.title}
                          </span>
                          {st.manHours != null && st.manHours > 0 && (
                            <span className="shrink-0 text-muted-foreground/70">
                              {st.manHours}ชม.
                            </span>
                          )}
                        </button>
                        {subAssignees.length > 0 && (
                          <p className="text-[10px] text-muted-foreground/70 ml-5 flex items-center gap-0.5">
                            <Users className="w-2.5 h-2.5" />
                            {subAssignees.map((a) => a.name).join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Attachments */}
              {task.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {task.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={normalizeUrl(att.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {att.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Activity History toggle */}
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                {historyOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                ประวัติการแก้ไข ({activityLogs.length})
              </button>

              {historyOpen && (
                <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">ยังไม่มีประวัติ</p>
                  ) : (
                    activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs bg-muted/50 rounded px-2 py-1"
                      >
                        <span className="font-medium">{logUserName(log.userId)}</span>{" "}
                        {log.action}
                        <span className="text-muted-foreground ml-1">
                          · {formatActivityDate(log.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <TaskForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={(t) => {
            updateTask(t);
            if (currentUser) {
              addLog({
                id: Math.random().toString(36).substring(2, 11),
                taskId: t.id,
                taskTitle: t.title,
                groupId: t.groupId,
                userId: currentUser.id,
                action: "แก้ไขข้อมูลงาน",
                timestamp: new Date().toISOString(),
              });
            }
            toast.success("อัปเดตงานแล้ว");
          }}
          initialTask={task}
          groupId={task.groupId}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบงาน &quot;{task.title}&quot; หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
