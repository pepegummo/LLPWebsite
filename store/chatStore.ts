"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatChannel, ChatMessage } from "@/types";

interface ChatState {
  channels: ChatChannel[];
  messages: ChatMessage[];
  addChannel: (channel: ChatChannel) => void;
  deleteChannel: (channelId: string) => void;
  renameChannel: (channelId: string, name: string) => void;
  sendMessage: (message: ChatMessage) => void;
  deleteMessage: (messageId: string) => void;
  getChannelsByGroup: (groupId: string) => ChatChannel[];
  getMessagesByChannel: (channelId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      channels: [],
      messages: [],
      addChannel: (channel) =>
        set((state) => ({ channels: [...state.channels, channel] })),
      deleteChannel: (channelId) =>
        set((state) => ({
          channels: state.channels.filter((c) => c.id !== channelId),
          messages: state.messages.filter((m) => m.channelId !== channelId),
        })),
      renameChannel: (channelId, name) =>
        set((state) => ({
          channels: state.channels.map((c) =>
            c.id === channelId ? { ...c, name } : c
          ),
        })),
      sendMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      deleteMessage: (messageId) =>
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId),
        })),
      getChannelsByGroup: (groupId) =>
        get().channels.filter((c) => c.groupId === groupId),
      getMessagesByChannel: (channelId) =>
        get().messages.filter((m) => m.channelId === channelId),
    }),
    {
      name: "chat-storage-v1",
    }
  )
);
