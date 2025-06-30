import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { create } from "zustand";
import { auth0Config, auth0Endpoints } from "../constants/auth";

// Auth token interface
interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

// User interface
interface User {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

// Auth store interface
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleRedirect: (url: string) => Promise<boolean>;
  refreshTokens: () => Promise<boolean>;
  getUserInfo: () => Promise<User | null>;
  init: () => Promise<void>;
}

// Storage keys
const STORAGE_KEY_TOKENS = "auth_tokens";
const STORAGE_KEY_USER = "auth_user";

// Auth store implementation
export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: null,
  
  // Initialize auth state from storage
  init: async () => {
    try {
      const [tokensJson, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_TOKENS),
        AsyncStorage.getItem(STORAGE_KEY_USER),
      ]);
      
      if (tokensJson && userJson) {
        const tokens = JSON.parse(tokensJson);
        const user = JSON.parse(userJson);
        
        // Check if token is expired
        const now = Date.now();
        if (tokens.expiresAt > now) {
          set({ isAuthenticated: true, tokens, user });
        } else {
          // Try to refresh the token
          const success = await get().refreshTokens();
          if (!success) {
            // Clear expired tokens
            await AsyncStorage.multiRemove([STORAGE_KEY_TOKENS, STORAGE_KEY_USER]);
            set({ isAuthenticated: false, tokens: null, user: null });
          }
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ isLoading: false });
    }
  },
  
  // Login with Auth0
  login: async () => {
    try {
      set({ isLoading: true });
      
      // Construct the authorization URL
      const authUrl = new URL(auth0Endpoints.authorization);
      authUrl.searchParams.append("client_id", auth0Config.clientId);
      authUrl.searchParams.append("redirect_uri", auth0Config.redirectUri);
      authUrl.searchParams.append("scope", auth0Config.scope);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("prompt", "login");
      
      // Open the browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        auth0Config.redirectUri,
        {
          showInRecents: true,
          createTask: true,
        }
      );
      
      if (result.type === "success" && result.url) {
        await get().handleRedirect(result.url);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Handle redirect from Auth0
  handleRedirect: async (url: string) => {
    try {
      const parsedUrl = Linking.parse(url);
      
      // Extract the authorization code
      const code = parsedUrl.queryParams?.code;
      if (!code) {
        console.error("No code found in redirect URL");
        return false;
      }
      
      // Exchange code for tokens
      const tokenResponse = await fetch(auth0Endpoints.token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: auth0Config.clientId,
          code,
          redirect_uri: auth0Config.redirectUri,
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error("Token exchange failed:", await tokenResponse.text());
        return false;
      }
      
      const tokenData = await tokenResponse.json();
      
      // Calculate token expiration
      const expiresIn = tokenData.expires_in * 1000;
      const expiresAt = Date.now() + expiresIn;
      
      // Store tokens
      const tokens: AuthTokens = {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      };
      
      await AsyncStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
      
      // Get user info
      const user = await get().getUserInfo();
      
      if (user) {
        set({
          isAuthenticated: true,
          tokens,
          user,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error handling redirect:", error);
      return false;
    }
  },
  
  // Refresh tokens
  refreshTokens: async () => {
    try {
      const { tokens } = get();
      if (!tokens?.refreshToken) return false;
      
      const tokenResponse = await fetch(auth0Endpoints.token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: auth0Config.clientId,
          refresh_token: tokens.refreshToken,
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error("Token refresh failed:", await tokenResponse.text());
        return false;
      }
      
      const tokenData = await tokenResponse.json();
      
      // Calculate token expiration
      const expiresIn = tokenData.expires_in * 1000;
      const expiresAt = Date.now() + expiresIn;
      
      // Store new tokens
      const newTokens: AuthTokens = {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token || tokens.refreshToken,
        expiresAt,
      };
      
      await AsyncStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens));
      
      set({ tokens: newTokens });
      
      return true;
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      return false;
    }
  },
  
  // Get user info
  getUserInfo: async () => {
    try {
      const { tokens } = get();
      if (!tokens?.accessToken) return null;
      
      const userResponse = await fetch(auth0Endpoints.userInfo, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      
      if (!userResponse.ok) {
        console.error("User info request failed:", await userResponse.text());
        return null;
      }
      
      const user = await userResponse.json();
      
      // Store user info
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      
      set({ user });
      
      return user;
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  },
  
  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });
      
      // Construct the logout URL
      const logoutUrl = new URL(auth0Endpoints.logout);
      logoutUrl.searchParams.append("client_id", auth0Config.clientId);
      logoutUrl.searchParams.append(
        "returnTo",
        Platform.OS === "web" 
          ? window.location.origin 
          : Linking.createURL("/")
      );
      
      // Clear stored tokens and user info
      await AsyncStorage.multiRemove([STORAGE_KEY_TOKENS, STORAGE_KEY_USER]);
      
      // Reset auth state
      set({
        isAuthenticated: false,
        tokens: null,
        user: null,
      });
      
      // Open the browser for logout
      await WebBrowser.openBrowserAsync(logoutUrl.toString());
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Initialize auth state on module load
useAuthStore.getState().init();