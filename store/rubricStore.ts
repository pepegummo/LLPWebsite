"use client";

import { create } from "zustand";
import { RubricWeights } from "@/types";
import { api } from "@/lib/api";
import { mapRubric } from "@/lib/mappers";

export const DEFAULT_RUBRIC_WEIGHTS: RubricWeights = {
  contribution: 20,
  qualityOfWork: 20,
  responsibility: 30,
  communication: 10,
  teamwork: 10,
  effort: 10,
};

interface RubricState {
  weightsByTeam: Record<string, RubricWeights>;
  fetchRubric: (teamId: string) => Promise<void>;
  setWeights: (teamId: string, weights: RubricWeights) => Promise<void>;
  getWeights: (teamId: string) => RubricWeights;
  // Legacy single-team accessors kept for compatibility
  weights: RubricWeights;
  resetWeights: () => void;
}

export const useRubricStore = create<RubricState>()((set, get) => ({
  weightsByTeam: {},
  weights: DEFAULT_RUBRIC_WEIGHTS,

  fetchRubric: async (teamId) => {
    const raw = await api.evaluations.getRubric(teamId);
    const weights = mapRubric(raw);
    set((s) => ({
      weightsByTeam: { ...s.weightsByTeam, [teamId]: weights },
      weights,
    }));
  },

  setWeights: async (teamId, weights) => {
    await api.evaluations.updateRubric(teamId, {
      contribution: weights.contribution,
      qualityOfWork: weights.qualityOfWork,
      responsibility: weights.responsibility,
      communication: weights.communication,
      teamwork: weights.teamwork,
      effort: weights.effort,
    });
    set((s) => ({
      weightsByTeam: { ...s.weightsByTeam, [teamId]: weights },
      weights,
    }));
  },

  getWeights: (teamId) =>
    get().weightsByTeam[teamId] ?? DEFAULT_RUBRIC_WEIGHTS,

  resetWeights: () => set({ weights: DEFAULT_RUBRIC_WEIGHTS }),
}));
