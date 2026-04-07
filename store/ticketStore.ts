"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Ticket, TicketMessage, TicketStatus } from "@/types";

interface TicketState {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  addMessage: (ticketId: string, message: TicketMessage) => void;
  getTicketsByGroup: (groupId: string) => Ticket[];
  getTicketsByStudent: (studentId: string) => Ticket[];
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],
      addTicket: (ticket) =>
        set((state) => ({ tickets: [...state.tickets, ticket] })),
      updateTicketStatus: (ticketId, status) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, status, updatedAt: new Date().toISOString() }
              : t
          ),
        })),
      addMessage: (ticketId, message) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  messages: [...t.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),
      getTicketsByGroup: (groupId) =>
        get().tickets.filter((t) => t.groupId === groupId),
      getTicketsByStudent: (studentId) =>
        get().tickets.filter((t) => t.studentId === studentId),
    }),
    { name: "ticket-storage" }
  )
);
