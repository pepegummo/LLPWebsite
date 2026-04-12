"use client";

import { create } from "zustand";
import { StandaloneLink } from "@/types";
import { api } from "@/lib/api";
import { mapLink } from "@/lib/mappers";

interface LinkState {
  links: StandaloneLink[];
  isLoading: boolean;
  fetchLinks: (teamId: string) => Promise<void>;
  addLink: (data: Record<string, unknown>) => Promise<StandaloneLink>;
  updateLink: (id: string, data: Record<string, unknown>) => Promise<void>;
  removeLink: (linkId: string) => Promise<void>;
  getLinksByTeam: (teamId: string) => StandaloneLink[];
}

export const useLinkStore = create<LinkState>()((set, get) => ({
  links: [],
  isLoading: false,

  fetchLinks: async (teamId) => {
    set({ isLoading: true });
    try {
      const raw = await api.links.list(teamId);
      const fetched = (raw as object[]).map(mapLink);
      set((s) => ({
        links: [
          ...s.links.filter((l) => l.teamId !== teamId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addLink: async (data) => {
    const raw = await api.links.create(data);
    const link = mapLink(raw);
    set((s) => ({ links: [...s.links, link] }));
    return link;
  },

  updateLink: async (id, data) => {
    const raw = await api.links.update(id, data);
    const updated = mapLink(raw);
    set((s) => ({
      links: s.links.map((l) => (l.id === id ? updated : l)),
    }));
  },

  removeLink: async (linkId) => {
    await api.links.delete(linkId);
    set((s) => ({ links: s.links.filter((l) => l.id !== linkId) }));
  },

  getLinksByTeam: (teamId) => get().links.filter((l) => l.teamId === teamId),
}));
