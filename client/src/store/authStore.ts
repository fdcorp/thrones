import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../../../shared/types';
import { apiLogin, apiRegister, apiGetMe, apiUpdateProfile } from '@/lib/api';

interface AuthState {
  user:  UserProfile | null;
  token: string | null;
  error: string | null;
  loading: boolean;
}

interface AuthActions {
  login(username: string, password: string): Promise<void>;
  register(username: string, password: string): Promise<void>;
  logout(): void;
  refreshMe(): Promise<void>;
  updateElo(newElo: number): void;
  updateProfile(country: string | null): Promise<void>;
  clearError(): void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user:    null,
      token:   null,
      error:   null,
      loading: false,

      async login(username, password) {
        set({ loading: true, error: null });
        try {
          const { token, user } = await apiLogin(username, password);
          set({ token, user, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
        }
      },

      async register(username, password) {
        set({ loading: true, error: null });
        try {
          const { token, user } = await apiRegister(username, password);
          set({ token, user, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
        }
      },

      logout() {
        set({ user: null, token: null, error: null });
      },

      async refreshMe() {
        const { token } = get();
        if (!token) return;
        try {
          const { user } = await apiGetMe(token);
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },

      updateElo(newElo) {
        const { user } = get();
        if (user) set({ user: { ...user, elo: newElo } });
      },

      async updateProfile(country) {
        const { token } = get();
        if (!token) return;
        try {
          const { user } = await apiUpdateProfile(token, country);
          if (user) set({ user });
        } catch (e) {
          set({ error: (e as Error).message });
        }
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name: 'thrones-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
