// utils/auth.ts
import { LocalUser } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from "zustand/middleware";
import { createUser, getViewerProfile, loginUser } from '../services/userService';
interface AuthState {
  user: LocalUser | null
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, phoneNumber: string, role: string, aud: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: LocalUser | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      // In your auth store:
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = await loginUser(email, password);
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);

          const user = await getViewerProfile();

          if (!user) {
            throw new Error('Could not load your profile. Please try again.');
          }
          if (!user.emailVerified) {
            throw new Error(
              'Please verify your email before signing in. Check your inbox for a verification link.'
            );
          }

          set({
            accessToken,
            refreshToken,
            user,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (email: string, password: string, name: string, phoneNumber: string, role: string, aud: string) => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = await createUser({ email, password, name, phoneNumber, role, aud });

          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          const user = await getViewerProfile();

          if (!user || !accessToken || !refreshToken) {
            throw new Error('Login failed, Please try again later.');
          }
          if (!user.emailVerified) {
            throw new Error('Please verify your email to access the app. Check your inbox for a verification link.');
          }
          set({
            accessToken,
            refreshToken,
            isAuthenticated: user.emailVerified,
            isLoading: false
          });
          set({ user });
        }  finally {
          // ensure loading flag is always reset
          set({ isLoading: false });
        }
      },
      logout: async () => {
        set({ isLoading: true });
        try {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false
          });
        }  finally {
          set({ isLoading: false });
        }
      },
      setUser: (user: LocalUser | null) => {
        set({ user });
        set({ isAuthenticated: !!user });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)

// Auto-init on load

