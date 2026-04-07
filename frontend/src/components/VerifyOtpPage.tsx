"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/lib/auth-store";
import { getTheme } from "@/lib/theme";
import type { User, UserRole } from "@/types";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

interface VerifyOtpPageProps {
  role: UserRole;
  successRedirect: string;
  backHref: string;
  brandLabel?: string;
  onSuccess?: () => void;
}

export default function VerifyOtpPage({
  role,
  successRedirect,
  backHref,
  brandLabel = "The Archivist",
  onSuccess,
}: VerifyOtpPageProps) {
  const theme = getTheme(role);
  const setUser = useAuthStore((s) => s.setUser);

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSec, setResendSec] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startResendCooldown = useCallback(() => {
    setResendSec(RESEND_COOLDOWN_SEC);
  }, []);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const handleSendOtp = useCallback(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setError(null);
    setSending(true);
    api
      .post("/auth/phone/send-otp", { phone: `+91${digits}` })
      .then(() => {
        setOtpSent(true);
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        otpInputRefs.current[0]?.focus();
        startResendCooldown();
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setSending(false));
  }, [phone, startResendCooldown]);

  const handleVerifyOtp = useCallback(() => {
    const otp = otpDigits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Enter the complete 6-digit code");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    setError(null);
    setVerifying(true);
    api
      .post("/auth/phone/verify-otp", { phone: `+91${digits}`, otp })
      .then(() => api.get<User>("/users/me"))
      .then((r) => {
        setUser(r.data);
        onSuccess?.();
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setVerifying(false));
  }, [phone, otpDigits, setUser, onSuccess]);

  const handleResend = useCallback(() => {
    if (resendSec > 0) return;
    setError(null);
    setSending(true);
    const digits = phone.replace(/\D/g, "");
    api
      .post("/auth/phone/send-otp", { phone: `+91${digits}` })
      .then(startResendCooldown)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setSending(false));
  }, [phone, resendSec, startResendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = c;
      });
      setOtpDigits(next);
      const nextFocus = Math.min(index + chars.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = value.replace(/\D/g, "").slice(0, 1);
    setOtpDigits(next);
    if (value && index < OTP_LENGTH - 1) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-bg)] font-body">
      <div className="flex min-h-screen flex-col md:flex-row">
        <section className="relative hidden min-h-[320px] flex-[1.1] flex-col justify-center overflow-hidden bg-gradient-to-br from-[var(--color-brand-secondary)] via-[var(--color-panel-mid)] to-[var(--color-brand-primary)] p-10 text-white md:flex lg:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,_var(--color-brand-tertiary)_0%,transparent_55%)]" />
          </div>
          <div className="relative z-10 max-w-md">
            <span className="mb-6 inline-block bg-[var(--color-brand-tertiary)] px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white">
              Phone verification
            </span>
            <h1 className="font-headline text-4xl font-semibold leading-tight lg:text-5xl">Verify your mobile</h1>
            <p className="mt-5 text-sm leading-relaxed text-white/85">
              {role === "CA"
                ? "We use your number for account security and client communications."
                : "We use your number for booking reminders and account security."}
            </p>
            <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/20 pt-10">
              <div>
                <MaterialIcon name="shield_lock" className="!text-3xl text-[var(--color-brand-tertiary)]" />
                <p className="mt-3 font-headline text-lg font-semibold">Protected</p>
                <p className="mt-1 text-xs leading-relaxed text-white/75">OTP via secure channel.</p>
              </div>
              <div>
                <MaterialIcon name="timer" className="!text-3xl text-[var(--color-brand-tertiary)]" />
                <p className="mt-3 font-headline text-lg font-semibold">Fast</p>
                <p className="mt-1 text-xs leading-relaxed text-white/75">Complete in under a minute.</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-12 flex items-center justify-between text-xs text-white/70">
            <Link href={backHref} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
              <MaterialIcon name="arrow_back" className="!text-base" />
              Back
            </Link>
            <span className="uppercase tracking-widest opacity-80">{brandLabel}</span>
          </div>
        </section>

        <section className="flex flex-1 flex-col justify-center bg-[var(--color-surface)] px-6 py-12 md:px-12 lg:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-end md:hidden">
              <Link
                href="/terms"
                className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <MaterialIcon name="info" className="!text-lg" />
                Help
              </Link>
            </div>

            <h2 className="font-headline text-3xl font-semibold text-[var(--color-text)]">Phone number</h2>
            <p className="mt-2 text-[var(--color-text-muted)]">We’ll send a one-time code to this number.</p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-[var(--color-error-bg)] px-3 py-2 text-sm text-[var(--color-error)]">
                {error}
              </p>
            )}

            <label className="mt-8 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">
              Mobile (India +91)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="mt-2 w-full border-0 border-b-2 border-[var(--color-border)] bg-transparent px-0 py-3 text-lg text-[var(--color-text)] placeholder-[var(--color-text-muted-light)] outline-none transition focus:border-[var(--color-brand-primary)]"
              maxLength={14}
              disabled={otpSent}
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending}
              className={`mt-6 w-full rounded-lg py-3.5 text-sm font-bold text-white disabled:opacity-60 ${theme.btnPrimary}`}
            >
              {sending ? "Sending…" : "Send OTP"}
            </button>

            <div className={`mt-10 border-t border-[var(--color-border)] pt-8 ${!otpSent ? "pointer-events-none opacity-50" : ""}`}>
              <h3 className="font-headline text-xl font-semibold text-[var(--color-text)]">Enter code</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Six digits from your SMS.</p>
              <div className="mt-6 flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-14 w-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-center text-xl font-bold text-[var(--color-text)] outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/25 sm:h-14 sm:w-12"
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">
                  {resendSec > 0 ? (
                    <span className="font-medium text-[var(--color-timer)]">Resend in {resendSec}s</span>
                  ) : otpSent ? (
                    <span>Sent to +91{phone.replace(/\D/g, "")}</span>
                  ) : (
                    <span>—</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendSec > 0 || sending || !otpSent}
                  className={`font-bold disabled:opacity-40 ${theme.primaryText} hover:underline`}
                >
                  Resend OTP
                </button>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpDigits(Array(OTP_LENGTH).fill(""));
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-white py-3.5 text-sm font-bold text-[var(--color-text)] transition hover:bg-[var(--color-bg-subtle)]"
                >
                  Edit number
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifying || otpDigits.join("").length !== OTP_LENGTH || !otpSent}
                  className={`flex-1 rounded-lg py-3.5 text-sm font-bold text-white disabled:opacity-60 ${theme.btnPrimary}`}
                >
                  {verifying ? "Verifying…" : "Verify"}
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
              By verifying, you agree to our{" "}
              <Link href="/terms" className={`font-semibold ${theme.primaryText} hover:underline`}>
                Terms
              </Link>{" "}
              &amp;{" "}
              <Link href="/terms" className={`font-semibold ${theme.primaryText} hover:underline`}>
                Privacy
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
