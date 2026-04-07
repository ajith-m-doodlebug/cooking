"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

interface CASearchItem {
  id: string;
  full_name: string;
  icai_membership_number: string;
  year_of_qualification: number | null;
  firm_name: string | null;
  services: string[];
  consultation_mode: string;
  languages: string[];
  experience_years: number | null;
  fee_online: number | null;
  fee_inperson: number | null;
  available_days: string[];
  disclaimer: string | null;
}

interface SearchResponse {
  items: CASearchItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function SearchPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", "ca", 1, 20],
    queryFn: async () => {
      const res = await api.get<SearchResponse>("/search/ca", {
        params: { page: 1, size: 20 },
      });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-6 py-28 font-body">
        <p className="text-center text-[var(--color-text-muted)]">Loading directory…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-6 py-28 font-body">
        <p className="text-[var(--color-error)]">{getApiErrorMessage(error)}</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-[var(--color-brand-primary)] hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-body text-[var(--color-text)]">
      <nav className="sticky top-0 z-30 glass-editorial border-b border-[var(--color-border)]/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
          <Link href="/" className="font-headline text-xl font-bold text-[var(--color-brand-primary)]">
            The Archivist
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/search"
              className="hidden text-sm font-bold uppercase tracking-widest text-[var(--color-brand-tertiary)] sm:block"
            >
              Directory
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-[var(--color-brand-primary-hover)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 md:px-8 md:pt-16">
        <div className="mb-14 max-w-3xl">
          <span className="mb-4 block text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-brand-tertiary)]">
            Our network
          </span>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-[var(--color-brand-primary)] md:text-6xl md:leading-tight">
            Find your <span className="text-[var(--color-brand-secondary)]">Chartered Accountant</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
            Browse verified profiles, services, consultation modes, and indicative fees. Open a profile to book
            when you are signed in as a client.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {data?.items?.length === 0 ? (
            <li className="rounded-xl bg-[var(--color-surface)] p-10 text-[var(--color-text-muted)] shadow-editorial">
              No CAs match yet. Check back soon.
            </li>
          ) : (
            data?.items?.map((ca) => (
              <li key={ca.id}>
                <Link
                  href={`/ca/public/${ca.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl bg-[var(--color-surface)] shadow-editorial transition hover:shadow-editorial-lg"
                >
                  <div className="relative h-36 bg-gradient-to-br from-[var(--color-brand-primary)]/15 to-[var(--color-card-bg)]">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
                      <MaterialIcon name="account_balance" className="!text-[7rem] text-[var(--color-brand-primary)]" />
                    </div>
                    <div className="absolute bottom-4 left-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-editorial">
                      <MaterialIcon name="badge" className="!text-3xl text-[var(--color-brand-primary)]" filled />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-5">
                    <h2 className="font-headline text-xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-brand-primary)]">
                      {ca.full_name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      ICAI #{ca.icai_membership_number}
                      {ca.firm_name ? ` · ${ca.firm_name}` : ""}
                    </p>
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {ca.services?.join(" · ") || "Services on profile"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
                      <span className="rounded-full bg-[var(--color-bg-subtle)] px-3 py-1">{ca.consultation_mode}</span>
                      {ca.fee_online != null && (
                        <span className="rounded-full bg-[var(--color-bg-subtle)] px-3 py-1">₹{ca.fee_online} online</span>
                      )}
                    </div>
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-tertiary)]">
                      View profile
                      <MaterialIcon name="arrow_forward" className="!text-lg transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>

        {data && data.pages > 1 && (
          <p className="mt-10 text-sm text-[var(--color-text-muted)]">
            Page {data.page} of {data.pages} ({data.total} total)
          </p>
        )}
      </main>
    </div>
  );
}
