"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Group, Course } from "@/types";
import { mockGroups, mockCourses } from "@/lib/mockData";

interface GroupState {
  groups: Group[];
  courses: Course[];
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (groupId: string) => void;
  addMember: (groupId: string, userId: string) => void;
  removeMember: (groupId: string, userId: string) => void;
  inviteUser: (groupId: string, userId: string) => void;
  removeInvitation: (groupId: string, userId: string) => void;
  acceptInvitation: (groupId: string, userId: string) => void;
  rejectInvitation: (groupId: string, userId: string) => void;
  addCourse: (course: Course) => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      groups: mockGroups,
      courses: mockCourses,
      addGroup: (group) =>
        set((state) => ({ groups: [...state.groups, group] })),
      updateGroup: (group) =>
        set((state) => ({
          groups: state.groups.map((g) => (g.id === group.id ? group : g)),
        })),
      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        })),
      addMember: (groupId, userId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, memberIds: [...new Set([...g.memberIds, userId])] }
              : g
          ),
        })),
      removeMember: (groupId, userId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, memberIds: g.memberIds.filter((id) => id !== userId) }
              : g
          ),
        })),
      inviteUser: (groupId, userId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  invitedIds: [...new Set([...g.invitedIds, userId])],
                }
              : g
          ),
        })),
      removeInvitation: (groupId, userId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, invitedIds: g.invitedIds.filter((id) => id !== userId) }
              : g
          ),
        })),
      acceptInvitation: (groupId, userId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  invitedIds: g.invitedIds.filter((id) => id !== userId),
                  memberIds: [...new Set([...g.memberIds, userId])],
                }
              : g
          ),
        })),
      rejectInvitation: (groupId, userId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, invitedIds: g.invitedIds.filter((id) => id !== userId) }
              : g
          ),
        })),
      addCourse: (course) =>
        set((state) => ({ courses: [...state.courses, course] })),
    }),
    {
      name: "group-storage",
    }
  )
);
