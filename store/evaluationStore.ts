"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Evaluation } from "@/types";
import { mockEvaluations } from "@/lib/mockData";

interface EvaluationState {
  evaluations: Evaluation[];
  addEvaluation: (evaluation: Evaluation) => void;
  updateEvaluation: (evaluation: Evaluation) => void;
  getEvaluationsByGroup: (groupId: string) => Evaluation[];
  getEvaluationsByEvaluator: (evaluatorId: string) => Evaluation[];
  hasEvaluated: (evaluatorId: string, evaluateeId: string) => boolean;
}

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set, get) => ({
      evaluations: mockEvaluations,
      addEvaluation: (evaluation) =>
        set((state) => ({
          evaluations: [...state.evaluations, evaluation],
        })),
      updateEvaluation: (evaluation) =>
        set((state) => ({
          evaluations: state.evaluations.map((e) =>
            e.id === evaluation.id ? evaluation : e
          ),
        })),
      getEvaluationsByGroup: (groupId) =>
        get().evaluations.filter((e) => e.groupId === groupId),
      getEvaluationsByEvaluator: (evaluatorId) =>
        get().evaluations.filter((e) => e.evaluatorId === evaluatorId),
      hasEvaluated: (evaluatorId, evaluateeId) =>
        get().evaluations.some(
          (e) => e.evaluatorId === evaluatorId && e.evaluateeId === evaluateeId
        ),
    }),
    {
      name: "evaluation-storage",
    }
  )
);
