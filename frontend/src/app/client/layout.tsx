"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/auth";
import api from "@/lib/api";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

interface TermsStatus {
  has_accepted: boolean;
  current_version: string;
  accepted_version: string | null;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated) return;
    if (!user || !tokens?.access_token) {
      router.replace("/login");
      return;
    }
    if (user.role !== "USER") {
      router.replace("/ca/dashboard");
      return;
    }
    if (!user.is_phone_verified && pathname !== "/client/verify-phone") {
      router.replace("/client/verify-phone");
      return;
    }
    if (pathname === "/client/verify-phone") {
      setTermsChecked(true);
      setTermsAccepted(true);
      return;
    }
    api
      .get<TermsStatus>("/terms/status")
      .then((r) => {
        if (!r.data.has_accepted) {
          setTermsAccepted(false);
          router.replace(`/terms?role=USER`);
        }
        setTermsChecked(true);
      })
      .catch(() => setTermsChecked(true));
  }, [user, tokens, hasHydrated, router, pathname]);

  if (!hasHydrated || !user || user.role !== "USER") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Redirecting…</p>
      </main>
    );
  }

  if (!termsChecked || !termsAccepted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Checking access…</p>
      </main>
    );
  }

  const isVerifyPage = pathname === "/client/verify-phone";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-body">
      {!isVerifyPage && (
        <header className="sticky top-0 z-30 glass-editorial border-b border-[var(--color-border)]/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/client" className="font-headline text-lg font-bold text-[var(--color-brand-primary)]">
              Client portal
            </Link>
            <nav className="hidden items-center gap-8 md:flex" aria-label="Client">
              <Link
                href="/client"
                className={`text-sm font-semibold transition ${
                  pathname === "/client"
                    ? "text-[var(--color-brand-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
                }`}
              >
                Home
              </Link>
              <Link
                href="/search"
                className="text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-brand-primary)]"
              >
                Find CAs
              </Link>
              <Link
                href="/client/bookings"
                className={`text-sm font-semibold transition ${
                  pathname.startsWith("/client/bookings")
                    ? "text-[var(--color-brand-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)]"
                }`}
              >
                Bookings
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[180px] truncate text-xs text-[var(--color-text-muted)] sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
              >
                <MaterialIcon name="logout" className="!text-base" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
