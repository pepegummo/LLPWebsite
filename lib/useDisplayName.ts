"use client";

import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";

/**
 * Returns a resolver function: (userId, fallbackName, teamId?) => displayName
 * teamId defaults to the current user's activeTeamId.
 */
export function useDisplayName() {
  const { getDisplayName } = useProfileStore();
  const { currentUser } = useAuthStore();
  const activeTeamId = currentUser?.activeTeamId ?? "";

  return (userId: string, fallbackName: string, teamId?: string): string =>
    getDisplayName(userId, teamId ?? activeTeamId, fallbackName);
}
