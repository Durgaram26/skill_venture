import { create } from 'zustand';
import type { AuthUser } from '@skillventures/shared-types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  initialized: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  updateUser: (user: AuthUser) => void;
  setInitialized: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  initialized: false,
  setSession: (user, accessToken) => set({ user, accessToken, initialized: true }),
  updateUser: (user) => set({ user }),
  setInitialized: () => set({ initialized: true }),
  clearSession: () => set({ user: null, accessToken: null, initialized: true }),
}));
