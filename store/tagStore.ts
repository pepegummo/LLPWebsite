"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Tag } from "@/types";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface TagState {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  getTagsByGroup: (groupId: string) => Tag[];
  getNextColor: (groupId: string) => string;
}

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: [],
      addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
      removeTag: (tagId) =>
        set((state) => ({ tags: state.tags.filter((t) => t.id !== tagId) })),
      getTagsByGroup: (groupId) =>
        get().tags.filter((t) => t.groupId === groupId),
      getNextColor: (groupId) => {
        const groupTags = get().tags.filter((t) => t.groupId === groupId);
        return TAG_COLORS[groupTags.length % TAG_COLORS.length];
      },
    }),
    { name: "tag-storage" }
  )
);
