import { create } from 'zustand';

let timer;

export const useToastStore = create((set) => ({
  toast: '',
  flash: (message) => {
    clearTimeout(timer);
    set({ toast: message });
    timer = setTimeout(() => set({ toast: '' }), 2800);
  },
}));
