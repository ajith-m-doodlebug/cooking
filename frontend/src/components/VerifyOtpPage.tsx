"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/lib/auth-store";
import { getTheme } from "@/lib/theme";
import type { User, UserRole } from "@/types";

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
  brandLabel = "CA Booking Studio",
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
    <main className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-6xl rounded-[32px] bg-white border border-[var(--color-border)] shadow-[0_60px_110px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col md:flex-row md:min-h-[720px]">
        {/* Left: Welcome banner — same as login */}
        <section className="md:w-1/2 bg-gradient-to-b from-[var(--color-panel-start)] via-[var(--color-panel-mid)] to-[var(--color-panel-end)] px-8 sm:px-10 py-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-black/20 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[var(--color-panel-text)] uppercase">
              <span
                className={`h-2 w-2 rounded-full ${role === "CA" ? "bg-[var(--color-primary-ca)]" : "bg-[var(--color-primary-user)]"}`}
              />
              <span>{brandLabel}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-3">
              Verify your phone
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-panel-text)]/80 max-w-md mb-2">
              {role === "CA"
                ? "As a Chartered Accountant, we need your phone number to secure your account and for client communications."
                : "We need your phone number to secure your account and to send booking reminders and updates."}
            </p>
            <p className="text-sm text-[var(--color-panel-text)]/70 max-w-md">
              Enter the one-time code we send to your mobile. You must verify before accessing the platform.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between text-[11px] text-[var(--color-panel-text)]/70">
            <Link href={backHref} className="underline underline-offset-2">
              ← Back
            </Link>
            <Link href="/terms" className="underline underline-offset-2">
              Terms &amp; Conditions
            </Link>
          </div>
        </section>

        {/* Right: Form */}
        <section className="md:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-white">
          <div className="w-full max-w-sm">
            <div className="flex justify-end mb-6">
              <Link href="/terms" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1">
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full border border-[var(--color-border)] text-xs">i</span>
                Need help?
              </Link>
            </div>

            {/* Phone number verification — always visible */}
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">Enter phone number</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  We’ll send a verification code to this number.
                </p>
                {error && (
                  <p className="text-sm text-[var(--color-error)] bg-[var(--color-error-bg)] border border-red-200 rounded-lg px-3 py-2 mb-4">
                    {error}
                  </p>
                )}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={`w-full rounded-lg border px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-text-muted-light)] focus:ring-2 outline-none ${theme.inputBorder}`}
                  maxLength={14}
                  disabled={otpSent}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sending}
                  className={`mt-4 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 ${theme.btnPrimary}`}
                >
                  {sending ? "Sending…" : "Send OTP"}
                </button>

            {/* OTP box — visible below phone verification */}
            <div className={`mt-8 pt-6 border-t border-[var(--color-border)] ${!otpSent ? "opacity-60 pointer-events-none" : ""}`}>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">Verify OTP</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Enter the verification code we sent to your mobile number.
              </p>
              <div className="flex gap-2 justify-center mb-4">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-12 text-center text-lg font-semibold rounded-lg text-[var(--color-text)] focus:ring-2 outline-none ${theme.inputBorder}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm mb-6">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                    {resendSec > 0 ? (
                      <>
                        <span className="inline-block w-4 h-4 text-[var(--color-timer)]">⏱</span>
                        <span className="text-[var(--color-timer)] font-medium">{resendSec} Sec</span>
                      </>
                    ) : (
                      <span>{otpSent ? `Code sent to +91${phone.replace(/\D/g, "")}` : "—"}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendSec > 0 || sending || !otpSent}
                    className={`font-medium disabled:opacity-50 ${theme.primaryText} hover:underline`}
                  >
                    Resend OTP
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpDigits(Array(OTP_LENGTH).fill("")); setError(null); }}
                    className="flex-1 rounded-full py-3 text-sm font-semibold bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifying || otpDigits.join("").length !== OTP_LENGTH || !otpSent}
                    className={`flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 ${theme.btnPrimary}`}
                  >
                    {verifying ? "Verifying…" : "Verify"}
                  </button>
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
              By verifying, you agree to our{" "}
              <Link href="/terms" className={`${theme.primaryText} hover:underline`}>Terms of Use</Link>
              {" "}&amp;{" "}
              <Link href="/terms" className={`${theme.primaryText} hover:underline`}>Privacy Policy</Link>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
