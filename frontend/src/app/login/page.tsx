"use client";

import { useCallback, useState, useEffect } from "react";
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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"USER" | "CA" | null>(null);

  // Step 1: no role selected. Step 2: role selected, show terms then Sign in with Google.
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Terms for the selected role (CA or USER)
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

  return (
    <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-6xl rounded-[32px] bg-white border border-[#E5E7EB] shadow-[0_60px_110px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col md:flex-row md:min-h-[720px]">
        <section className="md:w-1/2 bg-gradient-to-b from-[#1F2937] via-[#4B5563] to-[#111827] px-8 sm:px-10 py-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-black/20 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#F8F8F8] uppercase">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              <span>CA Booking Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-3">
              Book. File. <span className="text-[#F59E0B]">Succeed.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#F8F8F8]/80 max-w-md mb-8">
              Seamlessly connect with verified Chartered Accountants, manage bookings, and stay ahead of every compliance deadline.
            </p>
            {error && (
              <p className="text-xs sm:text-sm text-red-400 mb-4 max-w-md bg-[#1A1C1E]/70 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-5 max-w-md text-white">
              {selectedRole === null ? (
                <>
                  <p className="text-xs font-medium tracking-wide text-[#F8F8F8]/70 uppercase mb-3">
                    I am a
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("USER")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 px-4 bg-white text-[#111827] text-sm font-semibold shadow-md hover:bg-[#F9FAFB] border border-[#E5E7EB] transition"
                  >
                    I am Looking for Chartered Accountant
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("CA")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 px-4 bg-[#F59E0B] text-white text-sm font-semibold shadow-md hover:bg-[#d97706] transition"
                  >
                    I am a Chartered Accountant
                  </button>
                </>
              ) : selectedRole !== null && !roleTermsAccepted ? (
                <>
                  {roleTermsLoading && (
                    <>
                      <p className="text-[#F8F8F8]/80 mb-2">Loading terms…</p>
                      <button
                        type="button"
                        onClick={handleBackToRole}
                        className="text-xs text-[#F8F8F8]/70 underline"
                      >
                        ← Back to role selection
                      </button>
                    </>
                  )}
                  {roleTermsError && (
                    <>
                      <p className="text-red-400 text-sm mb-2">{roleTermsError}</p>
                      <button
                        type="button"
                        onClick={handleBackToRole}
                        className="text-xs text-[#F8F8F8]/70 underline"
                      >
                        ← Back to role selection
                      </button>
                    </>
                  )}
                  {roleTerms && !roleTermsLoading && (
                    <>
                      <div className="mb-4">
                        <p className="text-xs font-medium text-[#F8F8F8]/70 uppercase mb-2">
                          Terms &amp; Conditions ({selectedRole === "CA" ? "Chartered Accountant" : "User"})
                        </p>
                        <div className="text-xs text-[#F8F8F8]/90 max-h-48 overflow-y-auto rounded-lg bg-black/20 p-3 mb-3 border border-white/10">
                          {(() => {
                            const sections = getTermsSections(roleTerms.content);
                            if (sections.length > 0) {
                              return (
                                <ol className="list-decimal list-outside pl-4 space-y-3 marker:font-semibold">
                                  {sections.map(({ number, title, body }: TermsSection) => (
                                    <li key={number} className="pl-1">
                                      <span className="font-semibold text-[#F8F8F8]">{title}</span>
                                      <p className="mt-0.5 text-[#F8F8F8]/85 leading-relaxed">{body}</p>
                                    </li>
                                  ))}
                                </ol>
                              );
                            }
                            return (
                              <div dangerouslySetInnerHTML={{ __html: roleTerms.content }} />
                            );
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={handleAcceptTerms}
                          className={`w-full rounded-full h-11 px-4 text-white text-sm font-semibold ${
                            selectedRole === "CA"
                              ? "bg-[#F59E0B] hover:bg-[#d97706]"
                              : "bg-[#4285F4] hover:bg-[#3367D6]"
                          }`}
                        >
                          I Accept
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToRole}
                        className="text-xs text-[#F8F8F8]/70 underline"
                      >
                        ← Back to role selection
                      </button>
                    </>
                  )}
                </>
              ) : showGoogleButton ? (
                <>
                  <p className="text-xs font-medium tracking-wide text-[#F8F8F8]/70 uppercase">
                    {selectedRole === "USER" ? "I am a User" : "I am a Chartered Accountant"}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(selectedRole!)}
                    disabled={!!loading}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-full h-11 px-4 text-sm font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed ${
                      selectedRole === "CA"
                        ? "bg-[#F59E0B] text-white hover:bg-[#d97706]"
                        : "bg-white text-[#111827] hover:bg-[#F9FAFB] border border-[#E5E7EB]"
                    }`}
                  >
                    {loading === selectedRole ? (
                      <span>Signing in…</span>
                    ) : (
                      <>
                        <span className={selectedRole === "CA" ? "text-white" : "text-[#4285F4]"}>
                          <GoogleIcon />
                        </span>
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToRole}
                    className="text-xs text-[#F8F8F8]/70 underline"
                  >
                    ← Change role
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between text-[11px] text-[#F8F8F8]/70">
            <p>
              <Link href="/" className="underline underline-offset-2">
                Back to home
              </Link>
            </p>
            <Link href="/terms" className="underline underline-offset-2">
              Terms &amp; Conditions
            </Link>
          </div>
        </section>

        <section className="md:w-1/2 relative bg-[#F3F4F6]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{
              backgroundImage:
                "url('/login-hero-sample.jpg'), linear-gradient(135deg, #E5E7EB, #9CA3AF)",
              backgroundBlendMode: "overlay",
            }}
          />
          <div className="relative h-full px-6 sm:px-8 py-8 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="rounded-full bg-white/90 px-3 py-1 text-[11px] text-[#4B5563] border border-[#E5E7EB]">
                Today • Smart CA Matching
              </div>
              <div className="w-8 h-8 rounded-full bg-[#111827]/80 flex items-center justify-center text-white text-xs">
                CA
              </div>
            </div>
            <div className="mt-8 space-y-4 max-w-xs">
              <div className="rounded-2xl bg-white/95 border border-[#E5E7EB] px-4 py-3 text-[#111827] shadow-lg">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#F8F8F8]/60 mb-1">
                  Upcoming review
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Tax filing with Priya CA</p>
                    <p className="text-[11px] text-[#6B7280]">Today • 05:30 pm – 06:30 pm</p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full bg-[#F59E0B] text-white text-[11px] font-semibold px-3 py-1">
                    Confirmed
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/90 border border-[#E5E7EB] px-4 py-3 text-[#111827] shadow-md">
                <div className="flex justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B7280]">This week</p>
                  <div className="flex gap-1 text-[11px] text-[#6B7280]">
                    <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]">GST</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]">ITR</span>
                  </div>
                </div>
                <div className="flex gap-2 text-[11px] text-[#6B7280]">
                  <div className="flex-1 rounded-xl bg-[#F9FAFB] px-3 py-2 border border-[#E5E7EB]">
                    <p className="font-semibold text-xs mb-1">3</p>
                    <p>Open filings</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-[#F9FAFB] px-3 py-2 border border-[#E5E7EB]">
                    <p className="font-semibold text-xs mb-1">2</p>
                    <p>Upcoming reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
