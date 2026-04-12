"use client";

import { create } from "zustand";
import { ChatChannel, ChatMessage } from "@/types";
import { api } from "@/lib/api";
import { mapChannel, mapMessage } from "@/lib/mappers";

interface ChatState {
  channels: ChatChannel[];
  messages: ChatMessage[];
  isLoading: boolean;
  fetchChannels: (teamId: string) => Promise<void>;
  fetchMessages: (channelId: string, limit?: number) => Promise<void>;
  addChannel: (teamId: string, name: string) => Promise<ChatChannel>;
  renameChannel: (channelId: string, name: string) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, teamId: string, content: string, mentions?: string[]) => Promise<ChatMessage>;
  deleteMessage: (messageId: string) => Promise<void>;
  getChannelsByTeam: (teamId: string) => ChatChannel[];
  getMessagesByChannel: (channelId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>()((set, get) => ({
  channels: [],
  messages: [],
  isLoading: false,

  fetchChannels: async (teamId) => {
    set({ isLoading: true });
    try {
      const raw = await api.chat.listChannels(teamId);
      const fetched = (raw as object[]).map(mapChannel);
      set((s) => ({
        channels: [
          ...s.channels.filter((c) => c.teamId !== teamId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (channelId, limit = 50) => {
    const raw = await api.chat.listMessages(channelId, limit);
    const fetched = (raw as object[]).map(mapMessage);
    set((s) => ({
      messages: [
        ...s.messages.filter((m) => m.channelId !== channelId),
        ...fetched,
      ],
    }));
  },

  addChannel: async (teamId, name) => {
    const raw = await api.chat.createChannel(teamId, name);
    const channel = mapChannel(raw);
    set((s) => ({ channels: [...s.channels, channel] }));
    return channel;
  },

  renameChannel: async (channelId, name) => {
    const raw = await api.chat.renameChannel(channelId, name);
    const updated = mapChannel(raw);
    set((s) => ({
      channels: s.channels.map((c) => (c.id === channelId ? updated : c)),
    }));
  },

  deleteChannel: async (channelId) => {
    await api.chat.deleteChannel(channelId);
    set((s) => ({
      channels: s.channels.filter((c) => c.id !== channelId),
      messages: s.messages.filter((m) => m.channelId !== channelId),
    }));
  },

  sendMessage: async (channelId, teamId, content, mentions) => {
    const raw = await api.chat.sendMessage(channelId, teamId, content, mentions);
    const message = mapMessage(raw);
    set((s) => ({ messages: [...s.messages, message] }));
    return message;
  },

  deleteMessage: async (messageId) => {
    await api.chat.deleteMessage(messageId);
    set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) }));
  },

  getChannelsByTeam: (teamId) =>
    get().channels.filter((c) => c.teamId === teamId),

  getMessagesByChannel: (channelId) =>
    get().messages.filter((m) => m.channelId === channelId),
}));
