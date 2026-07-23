import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const current = get().ids;
        if (current.includes(id)) {
          set({ ids: current.filter((x) => x !== id) });
          return;
        }
        if (current.length >= 3) {
          set({ ids: [...current.slice(1), id] });
          return;
        }
        set({ ids: [...current, id] });
      },
      clear: () => set({ ids: [] }),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'sv-compare' },
  ),
);
