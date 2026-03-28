"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { useRequireAuth } from "@/hooks/useAuth";
import { USER_THEME, CA_THEME } from "@/lib/theme";
import { getTermsSections } from "@/lib/terms";
import type { UserRole } from "@/types";

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
  const [status, setStatus] = useState<TermsStatus | null>(null);
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
        setStatus(st);
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
      <main className={`min-h-screen flex items-center justify-center p-8 ${isUserRole ? USER_THEME.bg : "bg-[var(--color-bg)]"}`}>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className={isUserRole ? USER_THEME.textMuted : "text-gray-500"}>Loading terms…</p>
        )}
      </main>
    );
  }

  const isCa = user?.role === "CA";
  const sections = getTermsSections(terms.content);
  const showAsList = sections.length > 0;

  return (
    <main className={`min-h-screen terms-page-bg flex flex-col items-center p-4 sm:p-6 md:p-8`}>
      <div className="w-full max-w-3xl flex flex-col flex-1">
        <div className="rounded-t-2xl overflow-hidden border border-b-0 border-[var(--color-border)] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div
            className={`h-2 w-full ${
              isCa
                ? "bg-gradient-to-r from-[var(--color-brand-tertiary)] via-[#ea8a5c] to-[var(--color-brand-tertiary-hover)]"
                : "bg-gradient-to-r from-[var(--color-brand-primary)] via-[#7a9395] to-[var(--color-brand-primary-hover)]"
            }`}
          />
          <div className="px-6 sm:px-8 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                  isCa ? "bg-[var(--color-primary-ca)]" : "bg-[var(--color-primary-user)]"
                }`}
              >
                📜
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
                  Terms &amp; Conditions
                </h1>
                <p className="text-xs sm:text-sm mt-0.5 text-[var(--color-text-muted)]">
                  Version {terms.version} · Acceptance required to continue
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] max-w-xl">
              When terms are updated, you must accept the latest version to continue using the platform.
            </p>
          </div>
        </div>

        <div className="flex-1 border border-t-0 border-[var(--color-border)] rounded-b-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto max-h-[50vh] sm:max-h-[55vh] p-6 sm:p-8">
            {showAsList ? (
              <ol className="list-decimal list-outside pl-6 space-y-6 marker:font-bold marker:text-[var(--color-text)]">
                {sections.map(({ number, title, body }) => (
                  <li key={number} className="pl-2">
                    <span className="font-semibold text-[var(--color-text)] block mb-1">{title}</span>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed ml-0">{body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div
                className="prose prose-sm max-w-none terms-html"
                dangerouslySetInnerHTML={{ __html: terms.content }}
              />
            )}
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 sm:px-8 py-4">
            {error && (
              <p className="text-sm text-red-600 mb-3" role="alert">
                {error}
              </p>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className={`w-full sm:w-auto min-w-[140px] px-6 py-3 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 transition ${isCa ? CA_THEME.btnPrimary : USER_THEME.btnPrimary}`}
            >
              {accepting ? "Accepting…" : "I Accept"}
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
        <main className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-bg-subtle)]">
          <p className="text-[var(--color-text-muted)]">Loading…</p>
        </main>
      }
    >
      <TermsContent />
    </Suspense>
  );
}
