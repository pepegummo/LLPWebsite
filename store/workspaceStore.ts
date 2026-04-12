"use client";

import { create } from "zustand";
import { Workspace, WorkspaceRole } from "@/types";
import { api } from "@/lib/api";
import { mapWorkspace } from "@/lib/mappers";

interface WorkspaceState {
  workspaces: Workspace[];
  isLoading: boolean;
  // Fetch all workspaces for the current user
  fetchWorkspaces: () => Promise<void>;
  // CRUD
  createWorkspace: (name: string) => Promise<Workspace>;
  updateWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (wsId: string) => void;
  addAdmin: (wsId: string, userId: string) => Promise<void>;
  removeAdmin: (wsId: string, userId: string) => Promise<void>;
  // Helpers (read-only, no API call)
  getWorkspaceRole: (wsId: string, userId: string) => WorkspaceRole | null;
  getWorkspacesByUser: (userId: string) => Workspace[];
  getWorkspacesByOwner: (userId: string) => Workspace[];
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces: [],
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const raw = await api.workspaces.list();
      set({ workspaces: (raw as object[]).map(mapWorkspace) });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkspace: async (name) => {
    const raw = await api.workspaces.create(name);
    const ws = mapWorkspace(raw);
    set((s) => ({ workspaces: [...s.workspaces, ws] }));
    return ws;
  },

  updateWorkspace: async (id, name) => {
    const raw = await api.workspaces.update(id, name);
    const updated = mapWorkspace(raw);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? updated : w)),
    }));
  },

  deleteWorkspace: (wsId) =>
    set((s) => ({ workspaces: s.workspaces.filter((w) => w.id !== wsId) })),

  addAdmin: async (wsId, userId) => {
    await api.workspaces.addAdmin(wsId, userId);
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === wsId && !w.adminIds.includes(userId)
          ? { ...w, adminIds: [...w.adminIds, userId] }
          : w
      ),
    }));
  },

  removeAdmin: async (wsId, userId) => {
    await api.workspaces.removeAdmin(wsId, userId);
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === wsId
          ? { ...w, adminIds: w.adminIds.filter((id) => id !== userId) }
          : w
      ),
    }));
  },

  getWorkspaceRole: (wsId, userId) => {
    const ws = get().workspaces.find((w) => w.id === wsId);
    if (!ws) return null;
    if (ws.ownerId === userId) return "owner";
    if (ws.adminIds.includes(userId)) return "admin";
    return null;
  },

  getWorkspacesByUser: (userId) =>
    get().workspaces.filter(
      (w) => w.ownerId === userId || w.adminIds.includes(userId)
    ),

  getWorkspacesByOwner: (userId) =>
    get().workspaces.filter((w) => w.ownerId === userId),
}));
