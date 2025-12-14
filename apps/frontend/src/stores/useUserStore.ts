import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  odId: string | null;
  nickname: string | null;
  setUser: (odId: string, nickname: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      odId: null,
      nickname: null,
      setUser: (odId, nickname) => set({ odId, nickname }),
      clearUser: () => set({ odId: null, nickname: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
