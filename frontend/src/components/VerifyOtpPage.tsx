"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/lib/auth-store";
import { getTheme } from "@/lib/theme";
import type { UserRole } from "@/types";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

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
  const [step, setStep] = useState<"phone" | "otp">("phone");
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
        setStep("otp");
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
      .then(() => api.get<{ id: string; email: string; phone: string | null; full_name: string | null; role: string; is_phone_verified: boolean; terms_accepted: boolean }>("/users/me"))
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
    <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-6xl rounded-[32px] bg-white border border-[#E5E7EB] shadow-[0_60px_110px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col md:flex-row md:min-h-[720px]">
        {/* Left: Welcome banner — same as login */}
        <section className="md:w-1/2 bg-gradient-to-b from-[#1F2937] via-[#4B5563] to-[#111827] px-8 sm:px-10 py-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-black/20 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#F8F8F8] uppercase">
              <span className={`h-2 w-2 rounded-full ${role === "CA" ? "bg-[#F59E0B]" : "bg-[#4285F4]"}`} />
              <span>{brandLabel}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-3">
              Verify your phone
            </h1>
            <p className="text-sm sm:text-base text-[#F8F8F8]/80 max-w-md mb-2">
              {role === "CA"
                ? "As a Chartered Accountant, we need your phone number to secure your account and for client communications."
                : "We need your phone number to secure your account and to send booking reminders and updates."}
            </p>
            <p className="text-sm text-[#F8F8F8]/70 max-w-md">
              Enter the one-time code we send to your mobile. You must verify before accessing the platform.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between text-[11px] text-[#F8F8F8]/70">
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
              <Link href="/terms" className="text-sm text-[#6B7280] hover:text-[#111827] flex items-center gap-1">
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full border border-[#E5E7EB] text-xs">i</span>
                Need help?
              </Link>
            </div>

            {step === "phone" ? (
              <>
                <h2 className="text-2xl font-bold text-[#111827] mb-1">Enter phone number</h2>
                <p className="text-sm text-[#6B7280] mb-6">
                  We’ll send a verification code to this number.
                </p>
                {error && (
                  <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-lg px-3 py-2 mb-4">
                    {error}
                  </p>
                )}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={`w-full rounded-lg border px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:ring-2 outline-none ${theme.inputBorder}`}
                  maxLength={14}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sending}
                  className={`mt-6 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 ${theme.btnPrimary}`}
                >
                  {sending ? "Sending…" : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#111827] mb-1">Verify OTP</h2>
                <p className="text-sm text-[#6B7280] mb-6">
                  Enter the verification code we just sent to your mobile number.
                </p>
                {error && (
                  <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-lg px-3 py-2 mb-4">
                    {error}
                  </p>
                )}
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
                      className={`w-12 h-12 text-center text-lg font-semibold rounded-lg text-[#111827] focus:ring-2 outline-none ${theme.inputBorder}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm mb-6">
                  <span className="text-[#6B7280] flex items-center gap-1">
                    {resendSec > 0 ? (
                      <>
                        <span className="inline-block w-4 h-4 text-[#DC2626]">⏱</span>
                        <span className="text-[#DC2626] font-medium">{resendSec} Sec</span>
                      </>
                    ) : (
                      <span>Code sent to +91{phone.replace(/\D/g, "")}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendSec > 0 || sending}
                    className={`font-medium disabled:opacity-50 ${theme.primaryText} hover:underline`}
                  >
                    Resend OTP
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtpDigits(Array(OTP_LENGTH).fill("")); setError(null); }}
                    className="flex-1 rounded-full py-3 text-sm font-semibold bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifying || otpDigits.join("").length !== OTP_LENGTH}
                    className={`flex-1 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 ${theme.btnPrimary}`}
                  >
                    {verifying ? "Verifying…" : "Verify"}
                  </button>
                </div>
                <p className="mt-6 text-center text-xs text-[#6B7280]">
                  By verifying, you agree to our{" "}
                  <Link href="/terms" className={`${theme.primaryText} hover:underline`}>Terms of Use</Link>
                  {" "}&amp;{" "}
                  <Link href="/terms" className={`${theme.primaryText} hover:underline`}>Privacy Policy</Link>.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                  <span className="text-xs text-[#6B7280]">Or Login with</span>
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                </div>
                <div className="mt-4 flex justify-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#4285F4]"
                    title="Google"
                  >
                    <GoogleIcon />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
