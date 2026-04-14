"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { api, saveTokens, clearTokens } from "@/lib/api";

interface AuthState {
  currentUser: User | null;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,

      loginWithCredentials: async (email, password) => {
        const { accessToken, refreshToken, user } = await api.auth.login(email, password);
        saveTokens(accessToken, refreshToken);
        set({
          currentUser: {
            id: user.id,
            name: user.name,
            email: user.email,
            activeTeamId: null,
          },
        });
      },

      logout: () => {
        clearTokens();
        api.auth.logout().catch(() => {});
        set({ currentUser: null });
      },

      updateCurrentUser: (user) => set({ currentUser: user }),

      setActiveWorkspace: (workspaceId) =>
        set((s) => ({
          currentUser: s.currentUser
            ? { ...s.currentUser, activeWorkspaceId: workspaceId }
            : null,
        })),
    }),
    { name: "auth-storage" }
  )
);
