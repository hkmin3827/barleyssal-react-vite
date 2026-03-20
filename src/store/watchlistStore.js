import { create } from "zustand";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
} from "../api/springApi";

export const useWatchlistStore = create((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  fetchFromServer: async () => {
    set({ loading: true });
    try {
      const data = await getWatchlist(); // [{ id, stockCode, stockName }]
      set({ items: data, initialized: true });
    } catch (err) {
      console.warn("[watchlistStore] fetchFromServer failed:", err);
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (stockCode, stockName) => {
    const { items } = get();
    const exists = items.some((i) => i.stockCode === stockCode);

    if (exists) {
      set({ items: items.filter((i) => i.stockCode !== stockCode) });
    } else {
      set({
        items: [
          ...items,
          { id: null, stockCode, stockName: stockName ?? stockCode },
        ],
      });
    }

    try {
      const res = await toggleWatchlist(stockCode, stockName ?? stockCode);
      if (!res.watched) {
        set((s) => ({
          items: s.items.filter((i) => i.stockCode !== stockCode),
        }));
      } else if (!exists) {
        const fresh = await getWatchlist();
        set({ items: fresh });
      }
    } catch (err) {
      console.error("[watchlistStore] toggle failed:", err);
      set({ items });
    }
  },

  remove: async (stockCode) => {
    const { items } = get();
    set({ items: items.filter((i) => i.stockCode !== stockCode) });

    try {
      await removeFromWatchlist(stockCode);
    } catch (err) {
      console.error("[watchlistStore] remove failed:", err);
      set({ items });
    }
  },

  add: async (stockCode, stockName) => {
    const { items } = get();
    if (items.some((i) => i.stockCode === stockCode)) return;

    set({
      items: [
        ...items,
        { id: null, stockCode, stockName: stockName ?? stockCode },
      ],
    });

    try {
      const item = await addToWatchlist(stockCode, stockName ?? stockCode);
      set((s) => ({
        items: s.items.map((i) =>
          i.stockCode === stockCode ? { ...i, id: item.id } : i,
        ),
      }));
    } catch (err) {
      console.error("[watchlistStore] add failed:", err);
      set({ items });
    }
  },

  reset: () => set({ items: [], initialized: false }),

  isWatched: (stockCode) => get().items.some((i) => i.stockCode === stockCode),
}));
