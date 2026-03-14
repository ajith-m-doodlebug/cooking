import { useAuthStore } from "./auth-store";
import type { User, Tokens, UserRole } from "@/types";
import api from "./api";
import type { AuthGoogleResponse } from "@/types";

const CA_PRE_ACCEPTED_TERMS_KEY = "ca_pre_accepted_terms_version";
const USER_PRE_ACCEPTED_TERMS_KEY = "user_pre_accepted_terms_version";

export function getCaPreAcceptedTermsVersion(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = sessionStorage.getItem(CA_PRE_ACCEPTED_TERMS_KEY);
  return v ?? undefined;
}

export function getUserPreAcceptedTermsVersion(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = sessionStorage.getItem(USER_PRE_ACCEPTED_TERMS_KEY);
  return v ?? undefined;
}

export function getPreAcceptedTermsVersion(role: UserRole): string | undefined {
  return role === "CA" ? getCaPreAcceptedTermsVersion() : getUserPreAcceptedTermsVersion();
}

export function setAuthFromLogin(user: User, tokens: Tokens) {
  console.log("[Auth] setAuthFromLogin", {
    userId: user.id,
    role: user.role,
  });
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setTokens(tokens);
  useAuthStore.getState().setStoredRefreshToken(tokens.refresh_token);
}

export async function loginWithGoogle(
  idToken: string,
  role: UserRole,
  preAcceptedTermsVersion?: string
) {
  console.log("[Auth] loginWithGoogle → POST /auth/google", {
    hasToken: Boolean(idToken),
    role,
    preAccepted: preAcceptedTermsVersion ?? null,
  });
  const body: { id_token: string; role: UserRole; pre_accepted_terms_version?: string } = {
    id_token: idToken,
    role,
  };
  if (preAcceptedTermsVersion) body.pre_accepted_terms_version = preAcceptedTermsVersion;
  const { data } = await api.post<AuthGoogleResponse>("/auth/google", body);
  setAuthFromLogin(data.user, data.tokens);
  return data;
}

export function logout() {
  useAuthStore.getState().logout();
  api.post("/auth/logout").catch(() => {});
}
