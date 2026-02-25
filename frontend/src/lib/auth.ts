import { useAuthStore } from "./auth-store";
import type { User, Tokens, UserRole } from "@/types";
import api from "./api";
import type { AuthGoogleResponse } from "@/types";

export function setAuthFromLogin(user: User, tokens: Tokens) {
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setTokens(tokens);
  useAuthStore.getState().setStoredRefreshToken(tokens.refresh_token);
}

export async function loginWithGoogle(idToken: string, role: UserRole) {
  const { data } = await api.post<AuthGoogleResponse>("/auth/google", {
    id_token: idToken,
    role,
  });
  setAuthFromLogin(data.user, data.tokens);
  return data;
}

export function logout() {
  useAuthStore.getState().logout();
  api.post("/auth/logout").catch(() => {});
}
