"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/auth";

export default function CALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user || !tokens?.access_token) {
      router.replace("/login");
      return;
    }
    if (user.role !== "CA") {
      router.replace("/client");
      return;
    }
    if (!user.is_phone_verified && pathname !== "/ca/verify-phone") {
      router.replace("/ca/verify-phone");
    }
  }, [user, tokens, router, pathname]);

  if (!user || user.role !== "CA") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting…</p>
      </main>
    );
  }

  const isVerifyPage = pathname === "/ca/verify-phone";
  const isOnboardingPage = pathname === "/ca/onboarding";

  return (
    <div className="min-h-screen">
      {!isVerifyPage && !isOnboardingPage && (
        <nav className="border-b px-6 py-3 flex items-center justify-between">
          <div className="flex gap-4">
            <Link href="/ca/dashboard" className="text-[var(--color-primary-ca)] hover:underline">
              Dashboard
            </Link>
            <Link href="/ca/bookings" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline">
              Bookings
            </Link>
            <Link href="/ca/subscription" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline">
              Subscription
            </Link>
            <Link href="/ca/settings" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline">
              Settings
            </Link>
          </div>
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Log out
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}
