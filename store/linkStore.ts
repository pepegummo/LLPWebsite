"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StandaloneLink } from "@/types";

interface LinkState {
  links: StandaloneLink[];
  addLink: (link: StandaloneLink) => void;
  removeLink: (linkId: string) => void;
  getLinksByGroup: (groupId: string) => StandaloneLink[];
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
      getLinksByGroup: (groupId) =>
        get().links.filter((l) => l.groupId === groupId),
    }),
    {
      name: "link-storage",
    }
  )
);
