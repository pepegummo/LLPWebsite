"use client";

import { create } from "zustand";
import { Notification } from "@/types";
import { api } from "@/lib/api";
import { mapNotification } from "@/lib/mappers";

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getNotificationsByUser: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const raw = await api.notifications.list();
      set({ notifications: (raw as object[]).map(mapNotification) });
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) =>
    set((s) => ({ notifications: [notification, ...s.notifications] })),

  markAsRead: async (notificationId) => {
    await api.notifications.markRead(notificationId);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: async () => {
    await api.notifications.markAllRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  getNotificationsByUser: (userId) =>
    get().notifications.filter((n) => n.userId === userId),

  getUnreadCount: (userId) =>
    get().notifications.filter((n) => n.userId === userId && !n.read).length,
}));
