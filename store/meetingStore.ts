"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Meeting } from "@/types";
import { mockMeetings } from "@/lib/mockData";

interface MeetingState {
  meetings: Meeting[];
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (meeting: Meeting) => void;
  deleteMeeting: (meetingId: string) => void;
  getMeetingsByTeam: (teamId: string) => Meeting[];
}

export const useMeetingStore = create<MeetingState>()(
  persist(
    (set, get) => ({
      meetings: mockMeetings,
      addMeeting: (meeting) =>
        set((state) => ({ meetings: [...state.meetings, meeting] })),
      updateMeeting: (meeting) =>
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === meeting.id ? meeting : m)),
        })),
      deleteMeeting: (meetingId) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== meetingId),
        })),
      getMeetingsByTeam: (teamId) =>
        get().meetings.filter((m) => m.teamId === teamId),
    }),
    { name: "meeting-storage-v2" }
  )
);
