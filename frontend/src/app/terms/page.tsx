"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { useRequireAuth } from "@/hooks/useAuth";
import { USER_THEME, CA_THEME } from "@/lib/theme";
import { getTermsSections } from "@/lib/terms";
import type { UserRole } from "@/types";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

interface TermsContent {
  id: string;
  role: UserRole;
  version: string;
  content: string;
}

interface TermsStatus {
  has_accepted: boolean;
  current_version: string;
  accepted_version: string | null;
}

function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "USER";
  const { user, isAuthenticated } = useRequireAuth();
  const [terms, setTerms] = useState<TermsContent | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      api.get<TermsContent>(`/terms/${role}`).then((r) => r.data),
      api.get<TermsStatus>("/terms/status").then((r) => r.data),
    ])
      .then(([content, st]) => {
        setTerms(content);
        if (st.has_accepted) {
          if (user?.role === "CA") router.replace("/ca/dashboard");
          else router.replace("/client");
        }
      })
      .catch((err) => {
        setError(getApiErrorMessage(err));
      });
  }, [isAuthenticated, role, user?.role, router]);

  const handleAccept = useCallback(() => {
    if (!terms) return;
    setAccepting(true);
    setError(null);
    api
      .post("/terms/accept", { version: terms.version })
      .then(() => {
        if (user?.role === "CA") router.push("/ca/dashboard");
        else router.push("/client");
      })
      .catch((err) => {
        setError(getApiErrorMessage(err));
        setAccepting(false);
      });
  }, [terms, user?.role, router]);

  const isUserRole = user?.role === "USER";

  if (!isAuthenticated || !terms) {
    return (
      <main
        className={`flex min-h-screen items-center justify-center p-8 ${isUserRole ? USER_THEME.bg : "bg-[var(--color-bg)]"}`}
      >
        {error ? (
          <p className="text-[var(--color-error)]">{error}</p>
        ) : (
          <p className={isUserRole ? USER_THEME.textMuted : "text-[var(--color-text-muted)]"}>Loading terms…</p>
        )}
      </main>
    );
  }

  const isCa = user?.role === "CA";
  const sections = getTermsSections(terms.content);
  const showAsList = sections.length > 0;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-10 font-body sm:px-6 md:py-14">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <div className="overflow-hidden rounded-t-2xl border border-b-0 border-[var(--color-border)]/80 bg-[var(--color-surface)] shadow-editorial">
          <div
            className={`h-1.5 w-full ${
              isCa
                ? "bg-gradient-to-r from-[var(--color-brand-tertiary)] via-[#ea8a5c] to-[var(--color-brand-tertiary-hover)]"
                : "bg-gradient-to-r from-[var(--color-brand-primary)] via-[#7a9395] to-[var(--color-brand-primary-hover)]"
            }`}
          />
          <div className="px-6 pb-5 pt-8 sm:px-10">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${
                  isCa ? "bg-[var(--color-primary-ca)]" : "bg-[var(--color-primary-user)]"
                }`}
              >
                <MaterialIcon name="gavel" className="!text-2xl" />
              </div>
              <div>
                <h1 className="font-headline text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
                  Terms &amp; conditions
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Version {terms.version} · Acceptance required to continue
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              When terms are updated, you must accept the latest version to continue using the platform.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-2xl border border-t-0 border-[var(--color-border)]/80 bg-[var(--color-surface)] shadow-editorial">
          <div className="scrollbar-hide max-h-[50vh] flex-1 overflow-y-auto p-6 sm:max-h-[55vh] sm:p-10">
            {showAsList ? (
              <ol className="list-decimal list-outside space-y-6 pl-5 marker:font-headline marker:text-[var(--color-brand-primary)]">
                {sections.map(({ number, title, body }) => (
                  <li key={number} className="pl-2">
                    <span className="font-headline text-lg font-semibold text-[var(--color-text)]">{title}</span>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div
                className="prose prose-sm max-w-none terms-html text-[var(--color-text-muted)]"
                dangerouslySetInnerHTML={{ __html: terms.content }}
              />
            )}
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)]/80 bg-[var(--color-bg-subtle)] px-6 py-5 sm:px-10">
            {error && (
              <p className="mb-3 text-sm text-[var(--color-error)]" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className={`w-full rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-editorial transition disabled:opacity-50 sm:w-auto ${isCa ? CA_THEME.btnPrimary : USER_THEME.btnPrimary}`}
            >
              {accepting ? "Accepting…" : "I accept"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-8">
          <p className="text-[var(--color-text-muted)]">Loading…</p>
        </main>
      }
    >
      <TermsContent />
    </Suspense>
  );
}
