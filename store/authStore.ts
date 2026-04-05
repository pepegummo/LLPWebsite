"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
      updateCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: "auth-storage",
    }
  )
);
