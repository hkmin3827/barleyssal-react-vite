import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMarketStore } from "./marketStore";
import { useWatchlistStore } from "./watchlistStore";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      login: (userData) => set({ user: userData, isLoggedIn: true }),
      logout: () => {
        useMarketStore.getState().clearUserData();
        useWatchlistStore.getState().reset();
        set({ user: null, isLoggedIn: false });
      },
      setUser: (userData) => set({ user: userData }),
    }),
    { name: "barleyssal-auth" },
  ),
);
