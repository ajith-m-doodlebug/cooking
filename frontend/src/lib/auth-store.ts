import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Tokens } from "@/types";

const REFRESH_TOKEN_KEY = "ca_marketplace_refresh_token";

export interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  setUser: (user: User | null) => void;
  setTokens: (tokens: Tokens | null) => void;
  logout: () => void;
  getStoredRefreshToken: () => string | null;
  setStoredRefreshToken: (token: string) => void;
  clearStoredRefreshToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      logout: () => {
        get().clearStoredRefreshToken();
        set({ user: null, tokens: null });
      },
      getStoredRefreshToken: () => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
      },
      setStoredRefreshToken: (token) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      },
      clearStoredRefreshToken: () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      },
    }),
    {
      name: "ca-marketplace-auth",
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
    }
  )
);
