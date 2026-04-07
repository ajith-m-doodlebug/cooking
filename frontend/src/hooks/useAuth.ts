"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { user, tokens, hasHydrated, logout: storeLogout } = useAuthStore();
  const router = useRouter();
  const isAuthenticated = Boolean(user && tokens?.access_token);

  const logout = () => {
    storeLogout();
    router.push("/login");
  };

  return { user, tokens, hasHydrated, isAuthenticated, logout };
}

export function useRequireAuth() {
  const { user, tokens, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated) return;
    if (!user || !tokens?.access_token) {
      router.replace("/login");
    }
  }, [user, tokens, hasHydrated, router]);

  return { user, tokens, hasHydrated, isAuthenticated: Boolean(user && tokens?.access_token) };
}

export function useRequireRole(allowedRoles: Array<"CA" | "USER">) {
  const { user, tokens, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated) return;
    if (!user || !tokens?.access_token) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      if (user.role === "CA") router.replace("/ca/dashboard");
      else router.replace("/client");
    }
  }, [user, tokens, hasHydrated, allowedRoles, router]);

  return { user, tokens, hasHydrated };
}
