"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RubricWeights } from "@/types";

export const DEFAULT_RUBRIC_WEIGHTS: RubricWeights = {
  contribution: 20,
  qualityOfWork: 20,
  responsibility: 30,
  communication: 10,
  teamwork: 10,
  effort: 10,
};

interface RubricState {
  weights: RubricWeights;
  setWeights: (weights: RubricWeights) => void;
  resetWeights: () => void;
}

export const useRubricStore = create<RubricState>()(
  persist(
    (set) => ({
      weights: DEFAULT_RUBRIC_WEIGHTS,
      setWeights: (weights) => set({ weights }),
      resetWeights: () => set({ weights: DEFAULT_RUBRIC_WEIGHTS }),
    }),
    { name: "rubric-storage" }
  )
);
