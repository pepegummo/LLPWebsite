"use client";

import { create } from "zustand";
import { Ticket, TicketStatus } from "@/types";
import { api } from "@/lib/api";
import { mapTicket } from "@/lib/mappers";

interface TicketState {
  tickets: Ticket[];
  isLoading: boolean;
  fetchTickets: (teamId: string) => Promise<void>;
  addTicket: (data: Record<string, unknown>) => Promise<Ticket>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  addMessage: (ticketId: string, content: string) => Promise<void>;
  getTicketsByTeam: (teamId: string) => Ticket[];
  getTicketsByStudent: (studentId: string) => Ticket[];
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  isLoading: false,

  fetchTickets: async (teamId) => {
    set({ isLoading: true });
    try {
      const raw = await api.tickets.list(teamId);
      const fetched = (raw as object[]).map(mapTicket);
      set((s) => ({
        tickets: [
          ...s.tickets.filter((t) => t.teamId !== teamId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addTicket: async (data) => {
    const raw = await api.tickets.create(data);
    const ticket = mapTicket(raw);
    set((s) => ({ tickets: [...s.tickets, ticket] }));
    return ticket;
  },

  updateTicketStatus: async (ticketId, status) => {
    await api.tickets.updateStatus(ticketId, status);
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, status, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  },

  addMessage: async (ticketId, content) => {
    const raw = await api.tickets.addMessage(ticketId, content);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = raw as any;
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              updatedAt: new Date().toISOString(),
              messages: [
                ...t.messages,
                {
                  id: r.id,
                  ticketId,
                  senderId: r.sender_id,
                  content: r.content,
                  createdAt: r.created_at,
                },
              ],
            }
          : t
      ),
    }));
  },

  getTicketsByTeam: (teamId) =>
    get().tickets.filter((t) => t.teamId === teamId),

  getTicketsByStudent: (studentId) =>
    get().tickets.filter((t) => t.studentId === studentId),
}));
