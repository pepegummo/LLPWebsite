"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "@/types";
import { mockProjects } from "@/lib/mockData";

interface ProjectState {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  getProjectsByWorkspace: (workspaceId: string) => Project[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: mockProjects,
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id ? project : p
          ),
        })),
      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        })),
      getProjectsByWorkspace: (workspaceId) =>
        get().projects.filter((p) => p.workspaceId === workspaceId),
    }),
    {
      name: "project-storage",
    }
  )
);
