"use client";

import { useState } from "react";
import { Task, TaskStatus } from "@/types";
import { useTaskStore, useAuthStore, useActivityStore, useTagStore } from "@/store";
import { KanbanColumn } from "./KanbanColumn";
import { TaskForm } from "./TaskForm";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { PlusCircle, User, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "รอดำเนินการ", color: "bg-slate-100" },
  { id: "in_progress", title: "กำลังดำเนินการ", color: "bg-blue-50" },
  { id: "done", title: "เสร็จสิ้น", color: "bg-green-50" },
];

function statusLabel(status: TaskStatus) {
  if (status === "done") return "เสร็จสิ้น";
  if (status === "in_progress") return "กำลังดำเนินการ";
  return "รอดำเนินการ";
}

interface KanbanBoardProps {
  groupId: string;
}

export function KanbanBoard({ groupId }: KanbanBoardProps) {
  const { tasks, addTask, moveTask, updateTask } = useTaskStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useActivityStore();
  const { getTagsByGroup } = useTagStore();
  const [addOpen, setAddOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filterMine, setFilterMine] = useState(false);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);

  const groupTags = getTagsByGroup(groupId);
  const groupTasks = tasks.filter((t) => t.groupId === groupId);
  const filteredByOwner = filterMine && currentUser
    ? groupTasks.filter((t) => t.assigneeIds.includes(currentUser.id))
    : groupTasks;
  const displayTasks = filterTagId
    ? filteredByOwner.filter((t) => (t.tags ?? []).includes(filterTagId))
    : filteredByOwner;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = groupTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const task = groupTasks.find((t) => t.id === taskId);
    if (!task) return;

    const isColumn = COLUMNS.some((c) => c.id === overId);
    if (isColumn) {
      const newStatus = overId as TaskStatus;
      if (task.status !== newStatus) {
        moveTask(taskId, newStatus);
        if (currentUser) {
          addLog({
            id: Math.random().toString(36).substring(2, 11),
            taskId,
            taskTitle: task.title,
            groupId,
            userId: currentUser.id,
            action: `เปลี่ยนสถานะ: ${statusLabel(task.status)} → ${statusLabel(newStatus)}`,
            timestamp: new Date().toISOString(),
          });
        }
        toast.success("ย้ายงานแล้ว");
      }
    } else {
      const overTask = groupTasks.find((t) => t.id === overId);
      if (overTask && overTask.status !== task.status) {
        moveTask(taskId, overTask.status);
        if (currentUser) {
          addLog({
            id: Math.random().toString(36).substring(2, 11),
            taskId,
            taskTitle: task.title,
            groupId,
            userId: currentUser.id,
            action: `เปลี่ยนสถานะ: ${statusLabel(task.status)} → ${statusLabel(overTask.status)}`,
            timestamp: new Date().toISOString(),
          });
        }
        toast.success("ย้ายงานแล้ว");
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const isColumn = COLUMNS.some((c) => c.id === overId);
    if (isColumn) {
      const task = groupTasks.find((t) => t.id === taskId);
      if (task && task.status !== overId) {
        moveTask(taskId, overId as TaskStatus);
      }
    } else {
      const overTask = groupTasks.find((t) => t.id === overId);
      const activeTaskObj = groupTasks.find((t) => t.id === taskId);
      if (overTask && activeTaskObj && overTask.status !== activeTaskObj.status) {
        moveTask(taskId, overTask.status);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Kanban Board</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filterMine ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMine((v) => !v)}
          >
            <User className="w-4 h-4 mr-1.5" />
            {filterMine ? "งานของฉัน" : "ทุกงาน"}
          </Button>
          {groupTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                setFilterTagId(filterTagId === tag.id ? null : tag.id)
              }
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-white transition-opacity"
              style={{
                backgroundColor: tag.color,
                opacity: filterTagId === tag.id || filterTagId === null ? 1 : 0.45,
              }}
            >
              <Tag className="w-2.5 h-2.5" />
              {tag.name}
            </button>
          ))}
          <Button onClick={() => setAddOpen(true)} size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            เพิ่มงาน
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={displayTasks.filter((t) => t.status === col.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card className="opacity-90 shadow-xl w-72">
              <CardContent className="p-3">
                <p className="font-medium text-sm">{activeTask.title}</p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {filterMine && currentUser && (
        <p className="text-xs text-muted-foreground">
          แสดงเฉพาะงานที่มอบหมายให้คุณ ({displayTasks.length} งาน)
        </p>
      )}

      {addOpen && (
        <TaskForm
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSave={(task) => {
            addTask(task);
            if (currentUser) {
              addLog({
                id: Math.random().toString(36).substring(2, 11),
                taskId: task.id,
                taskTitle: task.title,
                groupId,
                userId: currentUser.id,
                action: "สร้างงานใหม่",
                timestamp: new Date().toISOString(),
              });
            }
            toast.success("เพิ่มงานแล้ว");
          }}
          groupId={groupId}
        />
      )}
    </div>
  );
}
