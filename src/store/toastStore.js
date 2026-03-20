import { create } from "zustand";

let nextId = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = "error") => {
    const id = ++nextId;
    set((s) => ({
      toasts: [...s.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
