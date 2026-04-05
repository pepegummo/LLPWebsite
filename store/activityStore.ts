"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActivityLog } from "@/types";

interface ActivityState {
  logs: ActivityLog[];
  addLog: (log: ActivityLog) => void;
  getLogsByTask: (taskId: string) => ActivityLog[];
  getLogsByGroup: (groupId: string) => ActivityLog[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({ logs: [...state.logs, log] })),
      getLogsByTask: (taskId) =>
        get().logs.filter((l) => l.taskId === taskId),
      getLogsByGroup: (groupId) =>
        get().logs.filter((l) => l.groupId === groupId),
    }),
    {
      name: "activity-storage",
    }
  )
);
