"use client";

import { create } from "zustand";
import { Team, TeamRole } from "@/types";
import { api } from "@/lib/api";
import { mapTeam } from "@/lib/mappers";

interface TeamState {
  teams: Team[];
  isLoading: boolean;
  fetchTeamsByProject: (projectId: string) => Promise<void>;
  fetchMyTeams: () => Promise<void>;
  createTeam: (projectId: string, workspaceId: string, name: string) => Promise<Team>;
  updateTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  getTeamsByProject: (projectId: string) => Team[];
  getTeamsByUser: (userId: string) => Team[];
  getUserRole: (teamId: string, userId: string) => TeamRole | null;
  inviteUser: (teamId: string, userId: string) => Promise<void>;
  acceptInvitation: (teamId: string, userId: string) => Promise<void>;
  rejectInvitation: (teamId: string, userId: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  setMemberRole: (teamId: string, userId: string, role: TeamRole) => Promise<void>;
  setDisplayName: (teamId: string, displayName: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  teams: [],
  isLoading: false,

  fetchTeamsByProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const raw = await api.projects.listTeams(projectId);
      const fetched = (raw as object[]).map(mapTeam);
      set((s) => ({
        teams: [
          ...s.teams.filter((t) => t.projectId !== projectId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyTeams: async () => {
    set({ isLoading: true });
    try {
      const raw = await api.teams.mine();
      set({ teams: (raw as object[]).map(mapTeam) });
    } finally {
      set({ isLoading: false });
    }
  },

  createTeam: async (projectId, workspaceId, name) => {
    const raw = await api.teams.create(projectId, workspaceId, name);
    const team = mapTeam(raw);
    set((s) => ({ teams: [...s.teams, team] }));
    return team;
  },

  updateTeam: (team) =>
    set((s) => ({ teams: s.teams.map((t) => (t.id === team.id ? team : t)) })),

  deleteTeam: (teamId) =>
    set((s) => ({ teams: s.teams.filter((t) => t.id !== teamId) })),

  getTeamsByProject: (projectId) =>
    get().teams.filter((t) => t.projectId === projectId),

  getTeamsByUser: (userId) =>
    get().teams.filter((t) => t.members.some((m) => m.userId === userId)),

  getUserRole: (teamId, userId) => {
    const team = get().teams.find((t) => t.id === teamId);
    if (!team) return null;
    return team.members.find((m) => m.userId === userId)?.role ?? null;
  },

  inviteUser: async (teamId, userId) => {
    await api.teams.invite(teamId, userId);
    set((s) => ({
      teams: s.teams.map((t) =>
        t.id === teamId
          ? { ...t, invitedIds: [...new Set([...t.invitedIds, userId])] }
          : t
      ),
    }));
  },

  acceptInvitation: async (teamId, userId) => {
    await api.teams.acceptInvite(teamId);
    set((s) => ({
      teams: s.teams.map((t) =>
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
    }));
  },

  rejectInvitation: async (teamId, userId) => {
    await api.teams.rejectInvite(teamId);
    set((s) => ({
      teams: s.teams.map((t) =>
        t.id === teamId
          ? { ...t, invitedIds: t.invitedIds.filter((id) => id !== userId) }
          : t
      ),
    }));
  },

  removeMember: async (teamId, userId) => {
    await api.teams.removeMember(teamId, userId);
    set((s) => ({
      teams: s.teams.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
          : t
      ),
    }));
  },

  setMemberRole: async (teamId, userId, role) => {
    await api.teams.setRole(teamId, userId, role);
    set((s) => ({
      teams: s.teams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.userId === userId ? { ...m, role } : m
              ),
            }
          : t
      ),
    }));
  },

  setDisplayName: async (teamId, displayName) => {
    await api.teams.setDisplayName(teamId, displayName);
  },
}));
