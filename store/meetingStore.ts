"use client";

import { create } from "zustand";
import { Meeting } from "@/types";
import { api } from "@/lib/api";
import { mapMeeting } from "@/lib/mappers";

interface MeetingState {
  meetings: Meeting[];
  isLoading: boolean;
  fetchMeetings: (teamId: string) => Promise<void>;
  addMeeting: (data: Record<string, unknown>) => Promise<Meeting>;
  updateMeeting: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  getMeetingsByTeam: (teamId: string) => Meeting[];
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  meetings: [],
  isLoading: false,

  fetchMeetings: async (teamId) => {
    set({ isLoading: true });
    try {
      const raw = await api.meetings.list(teamId);
      const fetched = (raw as object[]).map(mapMeeting);
      set((s) => ({
        meetings: [
          ...s.meetings.filter((m) => m.teamId !== teamId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addMeeting: async (data) => {
    const raw = await api.meetings.create(data);
    const meeting = mapMeeting(raw);
    set((s) => ({ meetings: [...s.meetings, meeting] }));
    return meeting;
  },

  updateMeeting: async (id, data) => {
    const raw = await api.meetings.update(id, data);
    const updated = mapMeeting(raw);
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === id ? updated : m)),
    }));
  },

  deleteMeeting: async (meetingId) => {
    await api.meetings.delete(meetingId);
    set((s) => ({ meetings: s.meetings.filter((m) => m.id !== meetingId) }));
  },

  getMeetingsByTeam: (teamId) =>
    get().meetings.filter((m) => m.teamId === teamId),
}));
