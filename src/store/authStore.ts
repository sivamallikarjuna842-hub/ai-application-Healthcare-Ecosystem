import { create } from 'zustand';
import { setAuthToken } from '../utils/api';
import { fetchMe, loadAccessToken, loadUserFromStorage, clearAccessToken, saveUserToStorage } from '../utils/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  avatar?: string;
  specialty?: string;
  licenseNumber?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;

  // hydrate token/user on app load
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const existingUser = loadUserFromStorage();
  const token = loadAccessToken();
  if (token) setAuthToken(token);

  return {
    user: existingUser,
    isAuthenticated: Boolean(token && existingUser),

    login: (user) => {
      set({ user, isAuthenticated: true });
      saveUserToStorage(user);
    },

    logout: () => {
      set({ user: null, isAuthenticated: false });
      clearAccessToken();
      localStorage.removeItem('user');
    },

    setUser: (user) => {
      if (user) {
        set({ user, isAuthenticated: true });
        saveUserToStorage(user);
      } else {
        set({ user: null, isAuthenticated: false });
      }
    },

    hydrate: async () => {
      const tokenNow = loadAccessToken();
      if (!tokenNow) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      setAuthToken(tokenNow);
      try {
        const user = (await fetchMe()) as unknown as User;
        set({ user, isAuthenticated: true });
      } catch {
        set({ user: null, isAuthenticated: false });
        clearAccessToken();
        localStorage.removeItem('user');
      }
    },
  };
});
