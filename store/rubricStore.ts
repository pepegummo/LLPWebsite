"use client";

import { create } from "zustand";
import { RubricWeights } from "@/types";
import { api } from "@/lib/api";
import { mapRubric } from "@/lib/mappers";

export const DEFAULT_RUBRIC_WEIGHTS: RubricWeights = {
  enabled: false,
  contribution: 16.67,
  qualityOfWork: 16.67,
  responsibility: 16.67,
  communication: 16.67,
  teamwork: 16.67,
  effort: 16.65,
};

interface RubricState {
  weightsByWorkspace: Record<string, RubricWeights>;
  fetchRubric: (workspaceId: string) => Promise<void>;
  setWeights: (workspaceId: string, weights: RubricWeights) => Promise<void>;
  getWeights: (workspaceId: string) => RubricWeights;
}

export const useRubricStore = create<RubricState>()((set, get) => ({
  weightsByWorkspace: {},

  fetchRubric: async (workspaceId) => {
    const raw = await api.evaluations.getRubric(workspaceId);
    const weights = mapRubric(raw);
    set((s) => ({
      weightsByWorkspace: { ...s.weightsByWorkspace, [workspaceId]: weights },
    }));
  },

  setWeights: async (workspaceId, weights) => {
    await api.evaluations.updateRubric(workspaceId, {
      enabled: weights.enabled,
      contribution: weights.contribution,
      qualityOfWork: weights.qualityOfWork,
      responsibility: weights.responsibility,
      communication: weights.communication,
      teamwork: weights.teamwork,
      effort: weights.effort,
    });
    set((s) => ({
      weightsByWorkspace: { ...s.weightsByWorkspace, [workspaceId]: weights },
    }));
  },

  getWeights: (workspaceId) =>
    get().weightsByWorkspace[workspaceId] ?? DEFAULT_RUBRIC_WEIGHTS,
}));
