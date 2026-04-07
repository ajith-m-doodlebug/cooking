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
import { MaterialIcon } from "@/components/editorial/MaterialIcon";
import { useAuthStore } from "@/lib/auth-store";

const CA_PRE_ACCEPTED_TERMS_KEY = "ca_pre_accepted_terms_version";
const USER_PRE_ACCEPTED_TERMS_KEY = "user_pre_accepted_terms_version";

const IMG_CA =
  "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=640&q=80&auto=format&fit=crop";
const IMG_CLIENT =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80&auto=format&fit=crop";

function GoogleIcon() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, tokens, hasHydrated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"USER" | "CA" | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [roleTerms, setRoleTerms] = useState<{ version: string; content: string } | null>(null);
  const [roleTermsLoading, setRoleTermsLoading] = useState(false);
  const [roleTermsError, setRoleTermsError] = useState<string | null>(null);
  const [roleTermsAccepted, setRoleTermsAccepted] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || !tokens?.access_token) return;
    if (user.role === "CA") {
      router.replace(user.is_phone_verified ? "/ca/dashboard" : "/ca/verify-phone");
      return;
    }
    router.replace(user.is_phone_verified ? "/client" : "/client/verify-phone");
  }, [hasHydrated, user, tokens, router]);

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
    <div className="min-h-screen bg-white font-body text-[var(--color-text)] selection:bg-[var(--color-warning-bg)]">
      <header className="fixed top-0 z-40 w-full border-b border-[var(--color-border)]/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 md:px-8">
          <Link href="/" className="font-headline text-xl font-bold tracking-tight text-[var(--color-text)]">
            THE ARCHIVIST
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            <Link
              href="/search"
              className="text-sm font-semibold tracking-wide text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            >
              Compliance
            </Link>
            <Link
              href="/search"
              className="text-sm font-semibold tracking-wide text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            >
              Audit
            </Link>
            <Link
              href="/search"
              className="text-sm font-semibold tracking-wide text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            >
              Advisory
            </Link>
            <Link
              href="/terms"
              className="text-sm font-semibold tracking-wide text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            >
              Legal
            </Link>
          </nav>
          <Link
            href="/"
            className="rounded-md bg-[var(--color-brand-primary)] px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-[var(--color-brand-primary-hover)] active:scale-[0.98]"
          >
            Home
          </Link>
        </div>
      </header>

      <main id="portals" className="flex min-h-screen flex-col bg-white pt-20 md:flex-row">
        <section className="relative flex flex-1 flex-col justify-center overflow-hidden border-b border-[var(--color-border)]/50 p-8 md:border-b-0 md:border-r md:p-16 lg:p-24">
          <div className="pointer-events-none absolute inset-0 bg-[var(--color-bg-subtle)]/40" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-[85%] max-w-sm opacity-20 grayscale md:h-52">
            <div className="relative h-full w-full">
              <Image src={IMG_CA} alt="" fill className="object-cover object-left-bottom" sizes="28rem" />
            </div>
          </div>
          <div className="relative z-[1] mx-auto w-full max-w-md">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10">
              <MaterialIcon name="account_balance" className="!text-4xl text-[var(--color-brand-primary)]" />
            </div>
            <h1 className="font-headline text-4xl font-semibold leading-tight text-[var(--color-text)] md:text-5xl">
              Professional ledger access
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-brand-secondary)]">
              Secure entry for certified practitioners. Access audit tools, tax modules, and compliance workflows
              with precision.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSelectedRole("CA");
              }}
              className="group mt-10 flex w-full items-center justify-between rounded-lg bg-[var(--color-brand-primary)] px-8 py-5 text-sm font-extrabold uppercase tracking-widest text-white shadow-editorial transition hover:bg-[var(--color-brand-primary-hover)]"
            >
              <span>Authenticate as practitioner</span>
              <MaterialIcon name="arrow_forward" className="!text-xl transition-transform group-hover:translate-x-1" />
            </button>
            <div className="mt-6 flex items-center gap-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <MaterialIcon name="verified_user" className="!text-sm" />
              Certified accountant clearance required
            </div>
          </div>
        </section>

        <section className="relative flex flex-1 flex-col justify-center overflow-hidden p-8 md:p-16 lg:p-24">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-[90%] max-w-md opacity-15 grayscale">
            <div className="relative h-full w-full">
              <Image src={IMG_CLIENT} alt="" fill className="object-cover object-right-top" sizes="32rem" />
            </div>
          </div>
          <div className="relative z-[1] mx-auto w-full max-w-md md:ml-auto">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--color-brand-tertiary)]/10">
              <MaterialIcon name="analytics" className="!text-4xl text-[var(--color-brand-tertiary)]" />
            </div>
            <h2 className="font-headline text-4xl font-semibold leading-tight text-[var(--color-text)] md:text-5xl">
              Strategic financial oversight
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-brand-secondary)]">
              For business owners and teams: discover CAs, compare services and fees, and book consultations
              securely.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSelectedRole("USER");
              }}
              className="group mt-10 flex w-full items-center justify-between rounded-lg bg-[var(--color-card-bg)] px-8 py-5 text-sm font-extrabold uppercase tracking-widest text-[var(--color-brand-primary)] transition hover:bg-[var(--color-bg-subtle)]"
            >
              <span>Enter strategic portal</span>
              <MaterialIcon name="corporate_fare" className="!text-xl transition-transform group-hover:translate-x-1" />
            </button>
            <div className="mt-6 flex items-center gap-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-brand-neutral)]">
              <MaterialIcon name="lock" className="!text-sm" />
              Enterprise-grade sign-in
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-10 md:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-headline text-lg font-bold tracking-tight text-[var(--color-text)]">THE ARCHIVIST</span>
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} CA Marketplace. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-text-muted)]">
            <Link href="/terms" className="transition hover:text-[var(--color-brand-tertiary)]">
              Legal notice
            </Link>
            <Link href="/terms" className="transition hover:text-[var(--color-brand-tertiary)]">
              Privacy
            </Link>
            <Link href="/" className="transition hover:text-[var(--color-brand-tertiary)]">
              Marketing site
            </Link>
          </div>
        </div>
      </footer>

      {portalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-dialog-title"
        >
          <div className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--color-border)]/30 bg-[var(--color-surface)] p-6 shadow-editorial-lg sm:p-8">
            <h2 id="portal-dialog-title" className="font-headline text-3xl text-[var(--color-text)]">
              {selectedRole === "CA" ? "Practitioner access" : "Client portal"}
            </h2>
            <p className="mt-2 text-[var(--color-text-muted)]">
              Review terms for your role, then continue with Google.
            </p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-[var(--color-error-bg)] px-3 py-2 text-sm text-[var(--color-error)]">
                {error}
              </p>
            )}

            <div className="mt-8 space-y-6">
              {!roleTermsAccepted ? (
                <>
                  {roleTermsLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading terms…</p>}
                  {roleTermsError && <p className="text-sm text-[var(--color-error)]">{roleTermsError}</p>}
                  {roleTerms && !roleTermsLoading && (
                    <>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Terms &amp; conditions ({selectedRole === "CA" ? "Chartered Accountant" : "User"})
                      </p>
                      <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--color-bg-subtle)] p-4 text-xs leading-relaxed text-[var(--color-text-muted)] scrollbar-hide">
                        {(() => {
                          const sections = getTermsSections(roleTerms.content);
                          if (sections.length > 0) {
                            return (
                              <ol className="list-decimal list-outside space-y-3 pl-4 marker:font-semibold marker:text-[var(--color-text)]">
                                {sections.map(({ number, title, body }: TermsSection) => (
                                  <li key={number} className="pl-1">
                                    <span className="font-semibold text-[var(--color-text)]">{title}</span>
                                    <p className="mt-0.5">{body}</p>
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
                        className="w-full rounded-lg py-3.5 text-sm font-bold text-white transition hover:opacity-95"
                        style={{
                          backgroundColor:
                            selectedRole === "CA"
                              ? "var(--color-brand-tertiary)"
                              : "var(--color-brand-primary)",
                        }}
                      >
                        I accept
                      </button>
                    </>
                  )}
                </>
              ) : showGoogleButton ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(selectedRole!)}
                    disabled={!!loading}
                    className="group flex w-full items-center justify-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-4 px-6 shadow-[0_4px_12px_rgba(35,26,16,0.04)] transition hover:shadow-editorial disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading === selectedRole ? (
                      <span className="text-sm font-bold text-[var(--color-text)]">Signing in…</span>
                    ) : (
                      <>
                        <GoogleIcon />
                        <span className="text-sm font-bold text-[var(--color-text)] group-hover:text-[var(--color-brand-primary)]">
                          Sign in with Google
                        </span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-4 py-1">
                    <div className="h-px flex-1 bg-[var(--color-border)]/50" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">
                      Trust &amp; security
                    </span>
                    <div className="h-px flex-1 bg-[var(--color-border)]/50" />
                  </div>
                  <div className="space-y-4 rounded-lg bg-[var(--color-bg-subtle)] p-5">
                    <div className="flex gap-4">
                      <MaterialIcon name="shield_lock" className="!text-2xl shrink-0 text-[var(--color-brand-primary)]" />
                      <div>
                        <p className="text-sm font-bold text-[var(--color-brand-primary)]">Secure Google sign-in</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                          OAuth 2.0 — your password stays with Google. We use your account only to authenticate you
                          on this platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <button
                type="button"
                onClick={handleBackToRole}
                className="w-full text-center text-xs text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-text)] hover:underline"
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
