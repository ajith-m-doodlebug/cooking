"use client";

import { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithGooglePopup } from "@/lib/firebase";
import { loginWithGoogle, getPreAcceptedTermsVersion } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/errors";
import api from "@/lib/api";
import { getTermsSections, type TermsSection } from "@/lib/terms";
import type { UserRole } from "@/types";

const CA_PRE_ACCEPTED_TERMS_KEY = "ca_pre_accepted_terms_version";
const USER_PRE_ACCEPTED_TERMS_KEY = "user_pre_accepted_terms_version";

/** Placeholder photography (Unsplash) — swap for production assets when ready. */
const IMG_WATCH =
  "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=640&q=80&auto=format&fit=crop";
const IMG_CONFERENCE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80&auto=format&fit=crop";

const ARCHIVIST_SLATE = "#4A5D5E";
const ARCHIVIST_CREAM = "#F9F7F5";
const ARCHIVIST_BEIGE = "#F2E6D9";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function IconBuildingColumns({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M6 22H4a2 2 0 01-2-2v-4h4M18 22h2a2 2 0 002-2v-4h-4M6 22h12M10 9h4M10 13h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBarChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="4" y="14" width="4" height="8" rx="0.5" fill="currentColor" />
      <rect x="10" y="10" width="4" height="12" rx="0.5" fill="currentColor" />
      <rect x="16" y="6" width="4" height="16" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12h14m0 0l-5-5m5 5l-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconOffice({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 21h18M5 21V8l7-3v16M12 21V5l7 3v13M9 10v4M9 16v2M16 11v3M16 16v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 11V7a4 4 0 018 0v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"USER" | "CA" | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [roleTerms, setRoleTerms] = useState<{ version: string; content: string } | null>(null);
  const [roleTermsLoading, setRoleTermsLoading] = useState(false);
  const [roleTermsError, setRoleTermsError] = useState<string | null>(null);
  const [roleTermsAccepted, setRoleTermsAccepted] = useState(false);

  useEffect(() => {
    if (selectedRole === null) return;
    setRoleTerms(null);
    setRoleTermsError(null);
    setRoleTermsAccepted(false);
    setRoleTermsLoading(true);
    api
      .get<{ version: string; content: string }>(`/terms/${selectedRole}`)
      .then((r) => setRoleTerms(r.data))
      .catch((err) => setRoleTermsError(getApiErrorMessage(err)))
      .finally(() => setRoleTermsLoading(false));
  }, [selectedRole]);

  const handleAcceptTerms = useCallback(() => {
    if (!roleTerms || !selectedRole) return;
    if (typeof window !== "undefined") {
      const key = selectedRole === "CA" ? CA_PRE_ACCEPTED_TERMS_KEY : USER_PRE_ACCEPTED_TERMS_KEY;
      sessionStorage.setItem(key, roleTerms.version);
    }
    setRoleTermsAccepted(true);
  }, [roleTerms, selectedRole]);

  const handleBackToRole = useCallback(() => {
    setSelectedRole(null);
    setError(null);
    setRoleTerms(null);
    setRoleTermsAccepted(false);
  }, []);

  const handleGoogleSignIn = useCallback(
    async (role: UserRole) => {
      setError(null);
      setLoading(role);
      try {
        const idToken = await signInWithGooglePopup();
        if (!idToken) {
          setError(
            "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID in frontend/.env.local and restart."
          );
          return;
        }
        const preAccepted = getPreAcceptedTermsVersion(role);
        const data = await loginWithGoogle(idToken, role, preAccepted);
        if (!data.user.terms_accepted) {
          router.push(`/terms?role=${data.user.role}`);
          return;
        }
        if (data.user.role === "CA") {
          if (!data.user.is_phone_verified) {
            router.push("/ca/verify-phone");
            return;
          }
          router.push("/ca/onboarding");
        } else {
          if (!data.user.is_phone_verified) {
            router.push("/client/verify-phone");
            return;
          }
          router.push("/client");
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(null);
      }
    },
    [router]
  );

  const showGoogleButton = selectedRole !== null && roleTermsAccepted;
  const portalOpen = selectedRole !== null;

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <header className="shrink-0 border-b border-neutral-200/90 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 lg:px-10">
          <Link href="/" className="text-lg font-bold tracking-tight text-black md:text-xl">
            THE ARCHIVIST
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-neutral-400 md:flex" aria-label="Primary">
            <Link href="/search" className="transition hover:text-neutral-600">
              Compliance
            </Link>
            <Link href="/search" className="transition hover:text-neutral-600">
              Audit
            </Link>
            <Link href="/search" className="transition hover:text-neutral-600">
              Advisory
            </Link>
            <Link href="/terms" className="transition hover:text-neutral-600">
              Firm Profile
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => document.getElementById("auth-split")?.scrollIntoView({ behavior: "smooth" })}
            className="shrink-0 rounded-md px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:opacity-90"
            style={{ backgroundColor: ARCHIVIST_SLATE }}
          >
            Secure portal
          </button>
        </div>
      </header>

      <main id="auth-split" className="relative flex flex-1 flex-col md:flex-row min-h-0">
        {/* Left — practitioner (CA) */}
        <section
          className="relative flex flex-1 flex-col justify-between overflow-hidden border-b border-neutral-200/80 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20 md:border-b-0 md:border-r"
          style={{ backgroundColor: ARCHIVIST_CREAM }}
        >
          <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-[85%] max-w-sm opacity-[0.22] grayscale sm:h-52 md:h-64 md:max-w-md">
            <div className="relative h-full w-full">
              <Image
                src={IMG_WATCH}
                alt=""
                fill
                className="object-cover [object-position:left_bottom]"
                sizes="(max-width: 768px) 85vw, 28rem"
                priority
              />
            </div>
          </div>

          <div className="relative z-[1] max-w-xl">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-md bg-neutral-300/50">
              <IconBuildingColumns className="h-7 w-7 text-neutral-800" />
            </div>
            <h1 className="font-display text-4xl font-normal leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-[2.75rem]">
              Professional Ledger Access
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-500">
              Secure entry for certified practitioners. Access advanced audit tools, tax management modules, and
              institutional compliance frameworks with precision.
            </p>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSelectedRole("CA");
              }}
              className="mt-10 flex w-full max-w-md items-center justify-center gap-3 rounded-md px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:opacity-95 sm:w-auto sm:min-w-[20rem]"
              style={{ backgroundColor: ARCHIVIST_SLATE }}
            >
              Authenticate as practitioner
              <IconArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              <IconMapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              Certified accountant clearance required
            </p>
          </div>
        </section>

        {/* Right — client / strategic */}
        <section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-[90%] max-w-md opacity-[0.2] grayscale sm:h-48 md:h-56 md:max-w-lg">
            <div className="relative h-full w-full">
              <Image
                src={IMG_CONFERENCE}
                alt=""
                fill
                className="object-cover [object-position:right_top]"
                sizes="(max-width: 768px) 90vw, 32rem"
              />
            </div>
          </div>

          <div className="relative z-[1] max-w-xl md:ml-auto">
            <div
              className="mb-8 flex h-14 w-14 items-center justify-center rounded-md"
              style={{ backgroundColor: ARCHIVIST_BEIGE }}
            >
              <IconBarChart className="h-7 w-7 text-[#5c4a3a]" />
            </div>
            <h1 className="font-display text-4xl font-normal leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-[2.75rem]">
              Strategic Financial Oversight
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-500">
              Premium visibility for organization leaders and stakeholders. Monitor real-time fiscal performance,
              strategic reporting, and long-term advisory insights.
            </p>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSelectedRole("USER");
              }}
              className="mt-10 flex w-full max-w-md items-center justify-center gap-3 rounded-md border border-neutral-200/80 px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-800 transition hover:bg-neutral-50 sm:w-auto sm:min-w-[20rem]"
              style={{ backgroundColor: ARCHIVIST_BEIGE }}
            >
              Enter strategic portal
              <IconOffice className="h-5 w-5 text-neutral-700" />
            </button>

            <p className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a7349]">
              <IconLock className="h-3.5 w-3.5 shrink-0 text-[#9a7349]" />
              Enterprise grade data encryption
            </p>
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-neutral-200/90 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-5 py-6 text-sm text-neutral-400 md:flex-row lg:px-10">
          <span className="font-bold tracking-tight text-black">THE ARCHIVIST</span>
          <p className="text-center text-xs md:text-sm">
            © {new Date().getFullYear()} The Archivist Chartered Accountants. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm">
            <Link href="/terms" className="transition hover:text-neutral-600">
              Legal Notice
            </Link>
            <Link href="/terms" className="transition hover:text-neutral-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-neutral-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {/* Terms + Google — modal over landing */}
      {portalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-dialog-title"
        >
          <div className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl sm:p-8">
            <h2 id="portal-dialog-title" className="font-display text-2xl text-neutral-900">
              {selectedRole === "CA" ? "Practitioner access" : "Strategic portal"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {selectedRole === "CA"
                ? "Review terms, then sign in with Google to continue."
                : "Review terms, then sign in with Google to continue."}
            </p>

            {error && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-4">
              {!roleTermsAccepted ? (
                <>
                  {roleTermsLoading && (
                    <p className="text-sm text-neutral-500">Loading terms…</p>
                  )}
                  {roleTermsError && (
                    <p className="text-sm text-red-600">{roleTermsError}</p>
                  )}
                  {roleTerms && !roleTermsLoading && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Terms &amp; Conditions ({selectedRole === "CA" ? "Chartered Accountant" : "User"})
                      </p>
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                        {(() => {
                          const sections = getTermsSections(roleTerms.content);
                          if (sections.length > 0) {
                            return (
                              <ol className="list-decimal list-outside space-y-3 pl-4 marker:font-semibold">
                                {sections.map(({ number, title, body }: TermsSection) => (
                                  <li key={number} className="pl-1">
                                    <span className="font-semibold text-neutral-900">{title}</span>
                                    <p className="mt-0.5 leading-relaxed text-neutral-600">{body}</p>
                                  </li>
                                ))}
                              </ol>
                            );
                          }
                          return <div dangerouslySetInnerHTML={{ __html: roleTerms.content }} />;
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={handleAcceptTerms}
                        className="w-full rounded-md py-3 text-sm font-semibold text-white transition hover:opacity-95"
                        style={{
                          backgroundColor:
                            selectedRole === "CA" ? "var(--color-primary-ca)" : ARCHIVIST_SLATE,
                        }}
                      >
                        I Accept
                      </button>
                    </>
                  )}
                </>
              ) : showGoogleButton ? (
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(selectedRole!)}
                  disabled={!!loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === selectedRole ? (
                    <span>Signing in…</span>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleBackToRole}
                className="w-full text-center text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
              >
                ← Back to portal selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
