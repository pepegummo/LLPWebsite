"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Team, TeamRole } from "@/types";
import { mockTeams } from "@/lib/mockData";

interface TeamState {
  teams: Team[];
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  getTeamsByProject: (projectId: string) => Team[];
  getTeamsByUser: (userId: string) => Team[];
  getUserRole: (teamId: string, userId: string) => TeamRole | null;
  inviteUser: (teamId: string, userId: string) => void;
  removeInvitation: (teamId: string, userId: string) => void;
  acceptInvitation: (teamId: string, userId: string) => void;
  rejectInvitation: (teamId: string, userId: string) => void;
  removeMember: (teamId: string, userId: string) => void;
  setMemberRole: (teamId: string, userId: string, role: TeamRole) => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: mockTeams,
      addTeam: (team) =>
        set((state) => ({ teams: [...state.teams, team] })),
      updateTeam: (team) =>
        set((state) => ({
          teams: state.teams.map((t) => (t.id === team.id ? team : t)),
        })),
      deleteTeam: (teamId) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== teamId),
        })),
      getTeamsByProject: (projectId) =>
        get().teams.filter((t) => t.projectId === projectId),
      getTeamsByUser: (userId) =>
        get().teams.filter((t) =>
          t.members.some((m) => m.userId === userId)
        ),
      getUserRole: (teamId, userId) => {
        const team = get().teams.find((t) => t.id === teamId);
        if (!team) return null;
        const member = team.members.find((m) => m.userId === userId);
        return member?.role ?? null;
      },
      inviteUser: (teamId, userId) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, invitedIds: [...new Set([...t.invitedIds, userId])] }
              : t
          ),
        })),
      removeInvitation: (teamId, userId) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, invitedIds: t.invitedIds.filter((id) => id !== userId) }
              : t
          ),
        })),
      acceptInvitation: (teamId, userId) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  invitedIds: t.invitedIds.filter((id) => id !== userId),
                  members: [
                    ...t.members.filter((m) => m.userId !== userId),
                    { userId, role: "member" as TeamRole },
                  ],
                }
              : t
          ),
        })),
      rejectInvitation: (teamId, userId) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, invitedIds: t.invitedIds.filter((id) => id !== userId) }
              : t
          ),
        })),
      removeMember: (teamId, userId) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
              : t
          ),
        })),
      setMemberRole: (teamId, userId, role) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  members: t.members.map((m) =>
                    m.userId === userId ? { ...m, role } : m
                  ),
                }
              : t
          ),
        })),
    }),
    {
      name: "team-storage",
    }
  )
);
