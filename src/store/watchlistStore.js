import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useWatchlistStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ code, name }]

      toggle: (code, name) => {
        const { items } = get();
        const exists = items.some((i) => i.code === code);
        set({
          items: exists
            ? items.filter((i) => i.code !== code)
            : [...items, { code, name }],
        });
      },

      // WatchlistPage에서 직접 삭제할 때 사용
      remove: (code) =>
        set((state) => ({
          items: state.items.filter((i) => i.code !== code),
        })),

      isWatched: (code) => get().items.some((i) => i.code === code),
    }),
    { name: "barleyssal-watchlist" },
  ),
);
