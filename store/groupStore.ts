// Legacy store — replaced by workspaceStore, projectStore, teamStore.
// Kept as an empty stub to avoid breaking any remaining imports during migration.
import { create } from "zustand";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GroupState {}

export const useGroupStore = create<GroupState>()(() => ({}));
