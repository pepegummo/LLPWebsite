"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";
import { mockProfiles } from "@/lib/mockData";

interface ProfileState {
  profiles: UserProfile[];
  getProfile: (userId: string) => UserProfile | undefined;
  upsertProfile: (profile: UserProfile) => void;
  getDisplayName: (userId: string, teamId: string, fallbackName: string) => string;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: mockProfiles,
      getProfile: (userId) => get().profiles.find((p) => p.userId === userId),
      upsertProfile: (profile) =>
        set((state) => {
          const exists = state.profiles.some((p) => p.userId === profile.userId);
          if (exists) {
            return { profiles: state.profiles.map((p) => p.userId === profile.userId ? profile : p) };
          }
          return { profiles: [...state.profiles, profile] };
        }),
      getDisplayName: (userId, teamId, fallbackName) => {
        const profile = get().profiles.find((p) => p.userId === userId);
        if (!profile) return fallbackName;
        return profile.displayNames[teamId] || `${profile.firstName} ${profile.lastName}` || fallbackName;
      },
    }),
    { name: "profile-storage" }
  )
);
