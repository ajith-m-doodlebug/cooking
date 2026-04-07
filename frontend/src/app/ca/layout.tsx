"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/auth";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

const nav = [
  { href: "/ca/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/ca/profile/preview", label: "Profile preview", icon: "person" },
  { href: "/ca/bookings", label: "Bookings", icon: "event_available" },
  { href: "/ca/subscription", label: "Subscription", icon: "workspace_premium" },
  { href: "/ca/settings", label: "Settings", icon: "settings" },
] as const;

export default function CALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated) return;
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
  }, [user, tokens, hasHydrated, router, pathname]);

  if (!hasHydrated || !user || user.role !== "CA") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Redirecting…</p>
      </main>
    );
  }

  const isVerifyPage = pathname === "/ca/verify-phone";
  const isOnboardingPage = pathname === "/ca/onboarding";

  if (isVerifyPage || isOnboardingPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-body text-[var(--color-text)]">
      <aside className="sidebar-ca-gradient fixed left-0 top-0 z-50 hidden h-full w-72 flex-col border-r border-[var(--color-border)]/40 md:flex">
        <div className="p-8">
          <Link href="/ca/dashboard" className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-primary)] text-white shadow-editorial">
              <MaterialIcon name="account_balance" className="!text-xl text-white" filled />
            </div>
            <span className="font-headline text-xl font-semibold text-[var(--color-brand-primary)]">Archivist</span>
          </Link>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== "/ca/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-[var(--color-brand-primary)] shadow-editorial"
                      : "text-[var(--color-brand-neutral)] hover:bg-white/60 hover:text-[var(--color-brand-primary)]"
                  }`}
                >
                  <MaterialIcon name={item.icon} className="!text-xl" filled={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-8">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-brand-neutral)]">
              Signed in
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[var(--color-text)]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="mt-4 flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[var(--color-brand-neutral)] transition hover:text-[var(--color-brand-tertiary)]"
          >
            <MaterialIcon name="logout" className="!text-lg" />
            Sign out
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-[var(--color-border)]/50 bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] backdrop-blur-md md:left-72">
        <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-8">
          <p className="hidden font-headline text-lg font-semibold text-[var(--color-brand-primary)] md:block">
            Practitioner workspace
          </p>
          <Link href="/ca/dashboard" className="font-headline text-sm font-bold text-[var(--color-brand-primary)] md:hidden">
            Archivist
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] md:hidden"
          >
            Log out
          </button>
        </div>
        <nav
          className="scrollbar-hide flex gap-1 overflow-x-auto border-t border-[var(--color-border)]/40 px-2 py-2 md:hidden"
          aria-label="CA mobile"
        >
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/ca/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide ${
                  active ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="pt-[4.5rem] md:ml-72 md:pt-16">{children}</div>
    </div>
  );
}
