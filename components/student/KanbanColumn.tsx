"use client";

import { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}

export function KanbanColumn({ id, title, tasks, color }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-muted/30 min-w-[280px] w-full transition-colors",
        isOver && "bg-muted/60 border-primary/50"
      )}
    >
      {/* Column Header */}
      <div className={cn("px-4 py-3 border-b border-border rounded-t-xl", color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
              ไม่มีงาน
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
