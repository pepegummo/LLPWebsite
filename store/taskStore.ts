"use client";

import { create } from "zustand";
import { Task, Attachment, TaskStatus, SubTask } from "@/types";
import { api } from "@/lib/api";
import { mapTask } from "@/lib/mappers";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: (teamId: string) => Promise<void>;
  addTask: (data: Record<string, unknown>) => Promise<Task>;
  updateTask: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, status: TaskStatus) => Promise<void>;
  addAttachment: (taskId: string, attachment: Omit<Attachment, "id">) => Promise<void>;
  removeAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  addSubTask: (taskId: string, subTask: Omit<SubTask, "id">) => Promise<void>;
  removeSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  getTasksByTeam: (teamId: string) => Task[];
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async (teamId) => {
    set({ isLoading: true });
    try {
      const raw = await api.tasks.list(teamId);
      const fetched = (raw as object[]).map(mapTask);
      set((s) => ({
        tasks: [
          ...s.tasks.filter((t) => t.teamId !== teamId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (data) => {
    const raw = await api.tasks.create(data);
    // Re-fetch the full task with relations
    const full = await api.tasks.get((raw as { id: string }).id);
    const task = mapTask(full);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, data) => {
    const raw = await api.tasks.update(id, data);
    const updated = mapTask(raw);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (taskId) => {
    await api.tasks.delete(taskId);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
  },

  moveTask: async (taskId, status) => {
    await api.tasks.update(taskId, { status });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  },

  addAttachment: async (taskId, attachment) => {
    const raw = await api.tasks.addAttachment(taskId, attachment.label, attachment.url);
    const newAttachment: Attachment = {
      id: (raw as { id: string }).id,
      label: attachment.label,
      url: attachment.url,
    };
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, attachments: [...t.attachments, newAttachment] }
          : t
      ),
    }));
  },

  removeAttachment: async (taskId, attachmentId) => {
    await api.tasks.removeAttachment(taskId, attachmentId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
          : t
      ),
    }));
  },

  toggleSubTask: async (taskId, subTaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const sub = task.subTasks.find((s) => s.id === subTaskId);
    if (!sub) return;
    const completed = !sub.completed;
    await api.tasks.updateSubtask(taskId, subTaskId, { completed });
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updated = t.subTasks.map((st) =>
          st.id === subTaskId ? { ...st, completed } : st
        );
        const allDone = updated.length > 0 && updated.every((st) => st.completed);
        return {
          ...t,
          subTasks: updated,
          status: allDone ? "done" : t.status === "done" ? "in_progress" : t.status,
        };
      }),
    }));
  },

  addSubTask: async (taskId, subTask) => {
    const raw = await api.tasks.addSubtask(taskId, {
      title: subTask.title,
      manHours: subTask.manHours,
      assigneeIds: subTask.assigneeIds,
    });
    const newSub: SubTask = {
      id: (raw as { id: string }).id,
      title: subTask.title,
      completed: false,
      manHours: subTask.manHours,
      assigneeIds: subTask.assigneeIds ?? [],
    };
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, subTasks: [...t.subTasks, newSub] } : t
      ),
    }));
  },

  removeSubTask: async (taskId, subTaskId) => {
    await api.tasks.deleteSubtask(taskId, subTaskId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subTasks: t.subTasks.filter((st) => st.id !== subTaskId) }
          : t
      ),
    }));
  },

  getTasksByTeam: (teamId) => get().tasks.filter((t) => t.teamId === teamId),
}));
