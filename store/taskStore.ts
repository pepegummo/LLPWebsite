"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, Attachment, TaskStatus, SubTask } from "@/types";
import { mockTasks } from "@/lib/mockData";

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  addSubTask: (taskId: string, subTask: SubTask) => void;
  removeSubTask: (taskId: string, subTaskId: string) => void;
  getTasksByGroup: (groupId: string) => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: mockTasks,
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (task) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        })),
      moveTask: (taskId, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status } : t
          ),
        })),
      addAttachment: (taskId, attachment) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, attachments: [...t.attachments, attachment] }
              : t
          ),
        })),
      removeAttachment: (taskId, attachmentId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  attachments: t.attachments.filter(
                    (a) => a.id !== attachmentId
                  ),
                }
              : t
          ),
        })),
      toggleSubTask: (taskId, subTaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const updatedSubTasks = t.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, completed: !st.completed } : st
            );
            const allDone = updatedSubTasks.length > 0 && updatedSubTasks.every((st) => st.completed);
            return {
              ...t,
              subTasks: updatedSubTasks,
              status: allDone ? "done" : t.status === "done" ? "in_progress" : t.status,
            };
          }),
        })),
      addSubTask: (taskId, subTask) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subTasks: [...t.subTasks, subTask] }
              : t
          ),
        })),
      removeSubTask: (taskId, subTaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subTasks: t.subTasks.filter((st) => st.id !== subTaskId) }
              : t
          ),
        })),
      getTasksByGroup: (groupId) =>
        get().tasks.filter((t) => t.groupId === groupId),
    }),
    {
      name: "task-storage-v2",
    }
  )
);
