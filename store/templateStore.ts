"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Template, TemplateCategory } from "@/types";
import { mockTemplates } from "@/lib/mockData";

interface TemplateState {
  templates: Template[];
  addTemplate: (t: Template) => void;
  updateTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesByCategory: (category: TemplateCategory) => Template[];
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: mockTemplates,
      addTemplate: (t) => set((state) => ({ templates: [...state.templates, t] })),
      updateTemplate: (t) =>
        set((state) => ({ templates: state.templates.map((x) => x.id === t.id ? t : x) })),
      deleteTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((x) => x.id !== id) })),
      getTemplatesByCategory: (category) =>
        get().templates.filter((t) => t.category === category),
    }),
    { name: "template-storage" }
  )
);
