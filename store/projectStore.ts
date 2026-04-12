"use client";

import { create } from "zustand";
import { Project } from "@/types";
import { api } from "@/lib/api";
import { mapProject } from "@/lib/mappers";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectsByWorkspace: (workspaceId: string) => Project[];
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const raw = await api.workspaces.listProjects(workspaceId);
      const fetched = (raw as object[]).map(mapProject);
      // Merge: keep projects from other workspaces, replace for this workspace
      set((s) => ({
        projects: [
          ...s.projects.filter((p) => p.workspaceId !== workspaceId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (workspaceId, name, description) => {
    const raw = await api.projects.create(workspaceId, name, description);
    const project = mapProject(raw);
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  updateProject: async (id, data) => {
    const raw = await api.projects.update(id, data);
    const updated = mapProject(raw);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (projectId) => {
    await api.projects.delete(projectId);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
  },

  getProjectsByWorkspace: (workspaceId) =>
    get().projects.filter((p) => p.workspaceId === workspaceId),
}));
