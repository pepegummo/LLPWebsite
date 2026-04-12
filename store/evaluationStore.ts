"use client";

import { create } from "zustand";
import { Evaluation } from "@/types";
import { api } from "@/lib/api";
import { mapEvaluation } from "@/lib/mappers";

interface EvaluationState {
  evaluations: Evaluation[];
  isLoading: boolean;
  fetchEvaluations: (teamId: string) => Promise<void>;
  addEvaluation: (data: Record<string, unknown>) => Promise<void>;
  updateEvaluation: (evaluation: Evaluation) => void;
  getEvaluationsByTeam: (teamId: string) => Evaluation[];
  getEvaluationsByEvaluator: (evaluatorId: string) => Evaluation[];
  hasEvaluated: (evaluatorId: string, evaluateeId: string) => boolean;
}

export const useEvaluationStore = create<EvaluationState>()((set, get) => ({
  evaluations: [],
  isLoading: false,

  fetchEvaluations: async (teamId) => {
    set({ isLoading: true });
    try {
      const raw = await api.evaluations.list(teamId);
      const fetched = (raw as object[]).map(mapEvaluation);
      set((s) => ({
        evaluations: [
          ...s.evaluations.filter((e) => e.teamId !== teamId),
          ...fetched,
        ],
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addEvaluation: async (data) => {
    const raw = await api.evaluations.submit(data);
    const evaluation = mapEvaluation(raw);
    set((s) => ({
      evaluations: [
        ...s.evaluations.filter(
          (e) =>
            !(e.teamId === evaluation.teamId &&
              e.evaluatorId === evaluation.evaluatorId &&
              e.evaluateeId === evaluation.evaluateeId)
        ),
        evaluation,
      ],
    }));
  },

  updateEvaluation: (evaluation) =>
    set((s) => ({
      evaluations: s.evaluations.map((e) =>
        e.id === evaluation.id ? evaluation : e
      ),
    })),

  getEvaluationsByTeam: (teamId) =>
    get().evaluations.filter((e) => e.teamId === teamId),

  getEvaluationsByEvaluator: (evaluatorId) =>
    get().evaluations.filter((e) => e.evaluatorId === evaluatorId),

  hasEvaluated: (evaluatorId, evaluateeId) =>
    get().evaluations.some(
      (e) => e.evaluatorId === evaluatorId && e.evaluateeId === evaluateeId
    ),
}));
