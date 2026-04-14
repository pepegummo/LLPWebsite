"use client";

import { create } from "zustand";
import { UserProfile } from "@/types";
import { api } from "@/lib/api";
import { mapProfile } from "@/lib/mappers";

interface ProfileState {
  profiles: UserProfile[];
  fetchProfile: (userId: string) => Promise<UserProfile>;
  getProfile: (userId: string) => UserProfile | undefined;
  upsertProfile: (profile: UserProfile) => void;
  getDisplayName: (userId: string, teamId: string, fallbackName: string) => string;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profiles: [],

  fetchProfile: async (userId) => {
    const raw = await api.users.getById(userId);
    const profile = mapProfile(raw);
    set((s) => {
      const exists = s.profiles.some((p) => p.userId === userId);
      return {
        profiles: exists
          ? s.profiles.map((p) => (p.userId === userId ? profile : p))
          : [...s.profiles, profile],
      };
    });
    return profile;
  },

  getProfile: (userId) => get().profiles.find((p) => p.userId === userId),

  upsertProfile: (profile) =>
    set((s) => {
      const exists = s.profiles.some((p) => p.userId === profile.userId);
      return {
        profiles: exists
          ? s.profiles.map((p) => (p.userId === profile.userId ? profile : p))
          : [...s.profiles, profile],
      };
    }),

  getDisplayName: (userId, teamId, fallbackName) => {
    const profile = get().profiles.find((p) => p.userId === userId);
    if (!profile) return fallbackName;
    return (
      profile.displayNames[teamId] ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.name ||
      fallbackName
    );
  },
}));
