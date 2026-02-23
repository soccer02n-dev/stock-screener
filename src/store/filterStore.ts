import { create } from "zustand";

type SortKey =
  | "compositeScore"
  | "momentum1M"
  | "roe"
  | "relativeVolume"
  | "price"
  | "marketCap";

interface FilterState {
  minRoe: number;
  sortBy: SortKey;
  sortDesc: boolean;
  setMinRoe: (val: number) => void;
  setSortBy: (key: SortKey) => void;
  toggleSortOrder: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  minRoe: 10,
  sortBy: "compositeScore",
  sortDesc: true,
  setMinRoe: (val) => set({ minRoe: val }),
  setSortBy: (key) =>
    set((state) => ({
      sortBy: key,
      sortDesc: state.sortBy === key ? !state.sortDesc : true,
    })),
  toggleSortOrder: () => set((state) => ({ sortDesc: !state.sortDesc })),
}));
