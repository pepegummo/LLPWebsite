"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActivityLog } from "@/types";

interface ActivityState {
  logs: ActivityLog[];
  addLog: (log: ActivityLog) => void;
  getLogsByTask: (taskId: string) => ActivityLog[];
  getLogsByTeam: (teamId: string) => ActivityLog[];
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({ logs: [...state.logs, log] })),
      getLogsByTask: (taskId) =>
        get().logs.filter((l) => l.taskId === taskId),
      getLogsByTeam: (teamId) =>
        get().logs.filter((l) => l.teamId === teamId),
    }),
    {
      name: "activity-storage-v2",
    }
  )
);
