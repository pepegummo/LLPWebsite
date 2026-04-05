"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Notification } from "@/types";
import { mockNotifications } from "@/lib/mockData";

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getNotificationsByUser: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: (userId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n
          ),
        })),
      getNotificationsByUser: (userId) =>
        get().notifications.filter((n) => n.userId === userId),
      getUnreadCount: (userId) =>
        get().notifications.filter((n) => n.userId === userId && !n.read)
          .length,
    }),
    {
      name: "notification-storage",
    }
  )
);
