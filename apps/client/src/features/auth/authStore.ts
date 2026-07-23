import { create } from 'zustand';
import type { AuthUser } from '@skillventures/shared-types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  updateUser: (user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  updateUser: (user) => set({ user }),
  clearSession: () => set({ user: null, accessToken: null }),
}));
