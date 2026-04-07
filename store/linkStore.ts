"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StandaloneLink } from "@/types";

interface LinkState {
  links: StandaloneLink[];
  addLink: (link: StandaloneLink) => void;
  removeLink: (linkId: string) => void;
  getLinksByTeam: (teamId: string) => StandaloneLink[];
}

export const useLinkStore = create<LinkState>()(
  persist(
    (set, get) => ({
      links: [],
      addLink: (link) =>
        set((state) => ({ links: [...state.links, link] })),
      removeLink: (linkId) =>
        set((state) => ({
          links: state.links.filter((l) => l.id !== linkId),
        })),
      getLinksByTeam: (teamId) =>
        get().links.filter((l) => l.teamId === teamId),
    }),
    {
      name: "link-storage-v2",
    }
  )
);
