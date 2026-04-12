"use client";

import { create } from "zustand";
import { Tag } from "@/types";
import { api } from "@/lib/api";
import { mapTag } from "@/lib/mappers";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface TagState {
  tags: Tag[];
  fetchTags: (teamId: string) => Promise<void>;
  addTag: (teamId: string, name: string, color: string) => Promise<Tag>;
  removeTag: (tagId: string) => void;
  getTagsByTeam: (teamId: string) => Tag[];
  getNextColor: (teamId: string) => string;
}

export const useTagStore = create<TagState>()((set, get) => ({
  tags: [],

  fetchTags: async (teamId) => {
    const raw = await api.links.listTags(teamId);
    const fetched = (raw as object[]).map(mapTag);
    set((s) => ({
      tags: [...s.tags.filter((t) => t.teamId !== teamId), ...fetched],
    }));
  },

  addTag: async (teamId, name, color) => {
    const raw = await api.links.createTag(teamId, name, color);
    const tag = mapTag(raw);
    set((s) => ({ tags: [...s.tags, tag] }));
    return tag;
  },

  removeTag: (tagId) =>
    set((s) => ({ tags: s.tags.filter((t) => t.id !== tagId) })),

  getTagsByTeam: (teamId) => get().tags.filter((t) => t.teamId === teamId),

  getNextColor: (teamId) => {
    const teamTags = get().tags.filter((t) => t.teamId === teamId);
    return TAG_COLORS[teamTags.length % TAG_COLORS.length];
  },
}));
