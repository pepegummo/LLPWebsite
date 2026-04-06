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
  getMeetingsByGroup: (groupId: string) => Meeting[];
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
      getMeetingsByGroup: (groupId) =>
        get().meetings.filter((m) => m.groupId === groupId),
    }),
    { name: "meeting-storage" }
  )
);
