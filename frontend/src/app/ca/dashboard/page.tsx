"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

interface CAProfile {
  profile: {
    id: string;
    user_id: string;
    full_name: string;
    verification_status: string;
    is_visible: boolean;
    onboarding_complete: boolean;
    subscription_payment_status: string;
    active_subscription_id: string | null;
  };
  services: unknown;
  booking: unknown;
}

function firstName(full: string) {
  const p = full.trim().split(/\s+/)[0];
  return p || full;
}

export default function CADashboardPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["ca", "profile"],
    queryFn: async () => {
      const res = await api.get<CAProfile>("/ca/profile");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-[50vh] px-6 py-12 md:px-10">
        <p className="text-[var(--color-text-muted)]">Loading workspace…</p>
      </main>
    );
  }

  if (error) {
    const err = error as { response?: { status?: number; data?: { error?: { message?: string; code?: string } } } };
    if (err.response?.status === 404 || err.response?.data?.error?.code === "NOT_FOUND") {
      router.replace("/ca/onboarding");
      return null;
    }
    return (
      <main className="min-h-[50vh] px-6 py-12 md:px-10">
        <p className="text-[var(--color-error)]">{getApiErrorMessage(error)}</p>
      </main>
    );
  }

  const profile = data?.profile;

  if (profile && !profile.onboarding_complete) {
    router.replace("/ca/onboarding");
    return null;
  }

  const name = profile?.full_name ?? "Partner";
  const verified =
    profile?.verification_status?.toLowerCase().includes("verified") ||
    profile?.verification_status?.toLowerCase() === "approved";

  return (
    <main className="min-h-screen px-6 pb-16 pt-10 md:px-10 md:pt-12">
      <header className="mb-10 max-w-3xl">
        <h1 className="font-headline text-4xl font-semibold text-[var(--color-brand-primary)] md:text-5xl">
          Welcome back, {firstName(name)}.
        </h1>
        <p className="mt-3 text-lg text-[var(--color-brand-neutral)]">
          Manage visibility, bookings, and subscription from your workspace. Complete verification tasks from
          settings when prompted.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="space-y-8 lg:col-span-4">
          <section className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border)]/50 bg-white p-8 shadow-editorial">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--color-brand-primary)]/5 transition-transform group-hover:scale-110" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-brand-neutral)]">
              Profile status
            </p>
            <h2 className="font-headline mt-2 text-2xl font-bold text-[var(--color-brand-primary)]">
              {verified ? "Verification" : "Status"} · {profile?.verification_status ?? "—"}
            </h2>
            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-[var(--color-bg-subtle)] p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[var(--color-brand-primary)] shadow-editorial">
                <MaterialIcon name="verified_user" className="!text-3xl" filled={verified} />
              </div>
              <div>
                <p className="font-bold text-[var(--color-text)]">{profile?.full_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">CA profile on platform</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--color-brand-primary)]/[0.04] px-4 py-3">
              <span className="text-sm font-bold text-[var(--color-brand-primary)]">Public visibility</span>
              <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                {profile?.is_visible ? "Listed in search" : "Hidden"}
              </span>
            </div>
            <Link
              href="/ca/profile/preview"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-primary)] py-3.5 text-sm font-bold text-white transition hover:bg-[var(--color-brand-primary-hover)]"
            >
              <MaterialIcon name="visibility" className="!text-lg text-white" />
              View public profile
            </Link>
          </section>

          <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--color-brand-primary)] p-8 text-white shadow-editorial">
            <div className="pointer-events-none absolute bottom-0 right-0 p-4 opacity-10">
              <MaterialIcon name="workspace_premium" className="!text-8xl text-white" />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">Billing</p>
            <h3 className="font-headline mt-2 text-2xl font-bold">Subscription</h3>
            <p className="mt-2 text-sm text-white/75">Manage plan, payment method, and renewal.</p>
            <div className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-xs leading-relaxed text-white/85">
              <p>
                <span className="font-bold text-white">Payment status:</span>{" "}
                {profile?.subscription_payment_status?.replaceAll("_", " ") ?? "—"}
              </p>
              {profile?.active_subscription_id ? (
                <p className="mt-1 font-mono text-[10px] opacity-80">
                  Live subscription id: {profile.active_subscription_id}
                </p>
              ) : null}
            </div>
            <Link
              href="/ca/subscription"
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-white py-3.5 text-sm font-bold text-[var(--color-brand-primary)] transition hover:bg-[var(--color-bg-subtle)]"
            >
              Open subscription
            </Link>
          </section>
        </div>

        <div className="space-y-8 lg:col-span-8">
          <section className="rounded-[1.75rem] border border-[var(--color-border)]/50 bg-white p-8 shadow-editorial">
            <h3 className="font-headline text-xl font-bold text-[var(--color-brand-primary)]">Quick actions</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href="/ca/bookings"
                className="flex items-center gap-4 rounded-xl bg-[var(--color-bg-subtle)] p-5 transition hover:bg-[var(--color-card-bg)]"
              >
                <MaterialIcon name="event_note" className="!text-3xl text-[var(--color-brand-tertiary)]" />
                <div>
                  <p className="font-bold text-[var(--color-text)]">Bookings</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Consultations &amp; schedule</p>
                </div>
              </Link>
              <Link
                href="/ca/settings"
                className="flex items-center gap-4 rounded-xl bg-[var(--color-bg-subtle)] p-5 transition hover:bg-[var(--color-card-bg)]"
              >
                <MaterialIcon name="tune" className="!text-3xl text-[var(--color-brand-primary)]" />
                <div>
                  <p className="font-bold text-[var(--color-text)]">Workspace settings</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Services, fees, availability</p>
                </div>
              </Link>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8">
            <div className="flex items-start gap-4">
              <MaterialIcon name="info" className="!text-2xl shrink-0 text-[var(--color-brand-tertiary)]" />
              <div>
                <p className="font-headline text-lg font-bold text-[var(--color-text)]">Need help?</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Keep your ICAI details and services up to date so clients can book with confidence. Use{" "}
                  <Link href="/ca/settings" className="font-bold text-[var(--color-brand-primary)] underline-offset-2 hover:underline">
                    settings
                  </Link>{" "}
                  to adjust your listing.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
