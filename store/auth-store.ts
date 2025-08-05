// utils/auth.ts
import { LocalUser } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from "zustand/middleware";
import { getViewerProfile } from '../services/userService';
interface AuthState {
  // init: any;
  user: LocalUser | null
  // isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  /**
   * Complete login using pre-issued auth tokens.
   * Stores tokens and loads the current user; throws on failure.
   */
  login: (accessToken: string, refreshToken: string) => Promise<void>
  signup: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: LocalUser | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      // isLoading: false,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      // In your auth store:
      // init: async () => {
      // set({
      //   isLoading: false
      // });
      // },

      login: async (
        accessToken: string,
        refreshToken: string
      ): Promise<void> => {



        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);

        const userresonse = await getViewerProfile();
        console.log('User response:', JSON.stringify(userresonse));

        const user = userresonse.data;

        if (!userresonse.success || !user) {
          throw new Error('Could not load your profile. Please try again.');
        }
        if (!user.emailVerified) {
          throw new Error(
            'Please verify your email before signing in. Check your inbox for a verification link.'
          );
        }
        console.log('User response:', JSON.stringify(user));
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: !!accessToken && !!refreshToken && user.emailVerified,
        });

      },

      signup: async (accessToken: string, refreshToken: string) => {
        try {

          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          const userresonse = await getViewerProfile();
          const user = userresonse.data
          console.log('User response:', user);
          if (!user || !accessToken || !refreshToken) {
            throw new Error('Login failed, Please try again later.');
          }
          // if (!user.emailVerified) {
          //   throw new Error('Please verify your email to access the app. Check your inbox for a verification link.');
          // }
          set({
            accessToken,
            refreshToken,
            isAuthenticated: user.emailVerified,
            user
          });
        } finally {
          // ensure loading flag is always reset

        }
      },
      logout: async () => {

        try {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            // isLoading: false
          });
        } finally {

        }
      },
      setUser: (user: LocalUser | null) => {
        set({ user });
        set({ isAuthenticated: !!user });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),

    }

  ),

)

// Auto-init on load
// useAuthStore.getState().init()
