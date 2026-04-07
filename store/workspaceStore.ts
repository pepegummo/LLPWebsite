"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Workspace } from "@/types";
import { mockWorkspaces } from "@/lib/mockData";

interface WorkspaceState {
  workspaces: Workspace[];
  addWorkspace: (ws: Workspace) => void;
  updateWorkspace: (ws: Workspace) => void;
  deleteWorkspace: (wsId: string) => void;
  getWorkspacesByOwner: (userId: string) => Workspace[];
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: mockWorkspaces,
      addWorkspace: (ws) =>
        set((state) => ({ workspaces: [...state.workspaces, ws] })),
      updateWorkspace: (ws) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) => (w.id === ws.id ? ws : w)),
        })),
      deleteWorkspace: (wsId) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== wsId),
        })),
      getWorkspacesByOwner: (userId) =>
        get().workspaces.filter((w) => w.ownerId === userId),
    }),
    {
      name: "workspace-storage",
    }
  )
);
