import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,          // { id, email, role, userName, active }
      isLoggedIn: false,

      login: (userData) => set({ user: userData, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
      setUser: (userData) => set({ user: userData }),
    }),
    { name: 'barleyssal-auth' }
  )
);
