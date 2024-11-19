import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { auth } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      login: async (email, password) => {
        try {
          const response = await auth.login({ email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      register: async (email, password, name) => {
        try {
          const response = await auth.register({ email, password, name });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true
          });
        } catch (error) {
          console.error('Registration failed:', error);
          throw error;
        }
      },

      logout: () => {
        set(initialState);
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);