"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Workspace, WorkspaceRole } from "@/types";
import { mockWorkspaces } from "@/lib/mockData";

interface WorkspaceState {
  workspaces: Workspace[];
  addWorkspace: (ws: Workspace) => void;
  updateWorkspace: (ws: Workspace) => void;
  deleteWorkspace: (wsId: string) => void;
  // role helpers
  getWorkspaceRole: (wsId: string, userId: string) => WorkspaceRole | null;
  getWorkspacesByUser: (userId: string) => Workspace[]; // owner หรือ admin
  getWorkspacesByOwner: (userId: string) => Workspace[]; // เจ้าของเท่านั้น (compat)
  addAdmin: (wsId: string, userId: string) => void;
  removeAdmin: (wsId: string, userId: string) => void;
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

      getWorkspaceRole: (wsId, userId) => {
        const ws = get().workspaces.find((w) => w.id === wsId);
        if (!ws) return null;
        if (ws.ownerId === userId) return "owner";
        if ((ws.adminIds ?? []).includes(userId)) return "admin";
        return null;
      },

      getWorkspacesByUser: (userId) =>
        get().workspaces.filter(
          (w) => w.ownerId === userId || (w.adminIds ?? []).includes(userId)
        ),

      getWorkspacesByOwner: (userId) =>
        get().workspaces.filter((w) => w.ownerId === userId),

      addAdmin: (wsId, userId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === wsId && !(w.adminIds ?? []).includes(userId)
              ? { ...w, adminIds: [...(w.adminIds ?? []), userId] }
              : w
          ),
        })),

      removeAdmin: (wsId, userId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === wsId
              ? { ...w, adminIds: (w.adminIds ?? []).filter((id) => id !== userId) }
              : w
          ),
        })),
    }),
    { name: "workspace-storage" }
  )
);
