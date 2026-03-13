import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWatchlistStore = create(
  persist(
    (set, get) => ({
      items: [],  // [{ code, name }]

      toggle: (code, name) => {
        const items = get().items;
        const exists = items.some(i => i.code === code);
        if (exists) {
          set({ items: items.filter(i => i.code !== code) });
        } else {
          set({ items: [...items, { code, name }] });
        }
      },

      isWatched: (code) => get().items.some(i => i.code === code),
    }),
    { name: 'barleyssal-watchlist' }
  )
);
