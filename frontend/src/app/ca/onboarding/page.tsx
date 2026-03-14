"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { CA_THEME } from "@/lib/theme";
import { logout } from "@/lib/auth";

const STEPS = [
  { id: 1, label: "Verification", short: "1" },
  { id: 2, label: "Services", short: "2" },
  { id: 3, label: "Booking", short: "3" },
  { id: 4, label: "Subscription", short: "4" },
  { id: 5, label: "Complete", short: "5" },
] as const;

const SERVICES = ["GST Filing", "Income Tax (ITR)", "TDS / TCS", "Audit & Assurance", "Company Law & Compliance", "ROC Filings", "Tax Planning", "Accounting & Bookkeeping", "Other"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EXPERIENCE_OPTIONS = [1, 3, 5, 10, 99];

const step1Schema = z.object({
  full_name: z.string().min(1, "Full name required"),
  icai_membership_number: z.string().length(6, "Must be 6 digits").regex(/^\d+$/, "Digits only"),
  cop_number: z.string().optional(),
  year_of_qualification: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  firm_name: z.string().optional(),
  registered_office_address: z.string().optional(),
});

const step2Schema = z.object({
  services: z.array(z.string()).min(1, "Select at least one service"),
  consultation_mode: z.enum(["ONLINE", "IN_PERSON", "BOTH"]),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  experience_years: z.coerce.number().optional().nullable(),
});

const step3Schema = z.object({
  slot_duration_minutes: z.coerce.number().int().min(15).max(120),
  available_days: z.array(z.string()).min(1, "Select at least one day"),
  time_slots: z.array(z.object({ start: z.string(), end: z.string() })).min(1, "Add at least one slot"),
  fee_online: z.coerce.number().min(0).optional().nullable(),
  fee_inperson: z.coerce.number().min(0).optional().nullable(),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;

interface CAProfileResponse {
  profile: { onboarding_complete: boolean; verification_status?: string };
  services: { services: string[]; consultation_mode: string; languages: string[]; experience_years: number | null } | null;
  booking: { slot_duration_minutes: number; available_days: string[]; time_slots: { start: string; end: string }[]; fee_online: number | null; fee_inperson: number | null } | null;
}

export default function CAOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["ca", "profile"],
    queryFn: async () => {
      const res = await api.get<CAProfileResponse>("/ca/profile");
      return res.data;
    },
    retry: (_, err: unknown) => {
      const e = err as { response?: { status?: number } };
      return e?.response?.status !== 404;
    },
  });

  useEffect(() => {
    if (profileLoading || !profileData) return;
    if (profileData.profile?.onboarding_complete) {
      router.replace("/ca/dashboard");
    }
  }, [profileData, profileLoading, router]);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      full_name: "",
      icai_membership_number: "",
      cop_number: "",
      year_of_qualification: undefined,
      firm_name: "",
      registered_office_address: "",
    },
  });

  const step2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: { services: [], consultation_mode: "BOTH", languages: [], experience_years: undefined },
  });

  const step3 = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      slot_duration_minutes: 30,
      available_days: [],
      time_slots: [{ start: "09:00", end: "10:00" }],
      fee_online: undefined,
      fee_inperson: undefined,
    },
  });

  const timeSlots = useFieldArray({ control: step3.control, name: "time_slots" });

  const onStep1 = step1.handleSubmit(async (data) => {
    setError(null);
    try {
      await api.post("/ca/onboarding/verification", {
        ...data,
        cop_number: data.cop_number || null,
        year_of_qualification: data.year_of_qualification ?? null,
        firm_name: data.firm_name || null,
        registered_office_address: data.registered_office_address || null,
      });
      setCurrentStep(2);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  });

  const onStep2 = step2.handleSubmit(async (data) => {
    setError(null);
    try {
      await api.post("/ca/onboarding/services", data);
      setCurrentStep(3);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  });

  const onStep3 = step3.handleSubmit(async (data) => {
    setError(null);
    try {
      await api.post("/ca/onboarding/booking", data);
      setCurrentStep(4);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  });

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-subtle)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading…</p>
      </main>
    );
  }

  if (profileData?.profile?.onboarding_complete) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)]">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[var(--color-text)]">CA Onboarding</h1>
          <button type="button" onClick={() => { logout(); router.push("/login"); }} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline">
            Log out
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">Complete the steps below to get your profile ready for clients.</p>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isPending = step.id > currentStep;
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                      ${isCompleted ? "bg-[var(--color-primary-ca)] text-white" : ""}
                      ${isActive ? "bg-[var(--color-primary-ca)] text-white ring-4 ring-[var(--color-primary-ca)]/30" : ""}
                      ${isPending ? "bg-[var(--color-border)] text-[var(--color-text-muted)]" : ""}
                    `}
                  >
                    {step.short}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium hidden sm:block ${isActive || isCompleted ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${isCompleted ? "bg-[var(--color-primary-ca)]" : "bg-[var(--color-border)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
              {error}
            </div>
          )}

          {/* Step 1 – Verification Details */}
          {currentStep === 1 && (
            <>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Verification Details</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Locked after approval. Profile will not be visible until verification is approved, subscription is active, and visibility is ON.</p>
              <form onSubmit={onStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Full Name (as per ICAI records)</label>
                  <input {...step1.register("full_name")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" placeholder="Enter full name" />
                  {step1.formState.errors.full_name && <p className="text-red-600 text-sm mt-0.5">{step1.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ICAI Membership Number (6 digits)</label>
                  <input {...step1.register("icai_membership_number")} maxLength={6} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" placeholder="e.g. 123456" />
                  {step1.formState.errors.icai_membership_number && <p className="text-red-600 text-sm mt-0.5">{step1.formState.errors.icai_membership_number.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">COP Number (if applicable)</label>
                  <input {...step1.register("cop_number")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Year of Qualification</label>
                  <input type="number" {...step1.register("year_of_qualification")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" placeholder="e.g. 2015" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Firm Name</label>
                  <input {...step1.register("firm_name")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Registered Office Address</label>
                  <textarea {...step1.register("registered_office_address")} rows={2} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" placeholder="Optional" />
                </div>
                <button type="submit" className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-white ${CA_THEME.btnPrimary}`}>
                  Save & Continue
                </button>
              </form>
            </>
          )}

          {/* Step 2 – Service Details */}
          {currentStep === 2 && (
            <>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Service Details</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Editable later from Settings.</p>
              <form onSubmit={onStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Services Offered</label>
                  <div className="space-y-2">
                    {SERVICES.map((s) => (
                      <label key={s} className="flex items-center gap-2">
                        <input type="checkbox" checked={step2.watch("services")?.includes(s) ?? false} onChange={(e) => { const cur = step2.getValues("services") ?? []; step2.setValue("services", e.target.checked ? [...cur, s] : cur.filter((x) => x !== s)); }} className="rounded border-[var(--color-border)] text-[var(--color-primary-ca)] focus:ring-[var(--color-primary-ca)]" />
                        <span className="text-sm text-[var(--color-text)]">{s}</span>
                      </label>
                    ))}
                  </div>
                  {step2.formState.errors.services && <p className="text-red-600 text-sm mt-0.5">{step2.formState.errors.services.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Consultation Mode</label>
                  <div className="flex gap-4">
                    {(["ONLINE", "IN_PERSON", "BOTH"] as const).map((m) => (
                      <label key={m} className="flex items-center gap-2">
                        <input type="radio" {...step2.register("consultation_mode")} value={m} className="rounded-full border-[var(--color-border)] text-[var(--color-primary-ca)] focus:ring-[var(--color-primary-ca)]" />
                        <span className="text-sm text-[var(--color-text)]">{m === "BOTH" ? "Both" : m === "ONLINE" ? "Online" : "In-person"}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Languages</label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {LANGUAGES.map((lang) => (
                      <label key={lang} className="flex items-center gap-2">
                        <input type="checkbox" checked={step2.watch("languages")?.includes(lang) ?? false} onChange={(e) => { const cur = step2.getValues("languages") ?? []; step2.setValue("languages", e.target.checked ? [...cur, lang] : cur.filter((x) => x !== lang)); }} className="rounded border-[var(--color-border)] text-[var(--color-primary-ca)] focus:ring-[var(--color-primary-ca)]" />
                        <span className="text-sm text-[var(--color-text)]">{lang}</span>
                      </label>
                    ))}
                  </div>
                  {step2.formState.errors.languages && <p className="text-red-600 text-sm mt-0.5">{step2.formState.errors.languages.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Experience (years)</label>
                  <select {...step2.register("experience_years")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]">
                    <option value="">Select</option>
                    {EXPERIENCE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n === 99 ? "10+" : n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setCurrentStep(1)} className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]">
                    Back
                  </button>
                  <button type="submit" className={`px-6 py-3 rounded-xl text-sm font-semibold text-white ${CA_THEME.btnPrimary}`}>Save & Continue</button>
                </div>
              </form>
            </>
          )}

          {/* Step 3 – Booking Details */}
          {currentStep === 3 && (
            <>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Booking Details</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Slot duration, available days, time slots, and fees. Editable later.</p>
              <form onSubmit={onStep3} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Slot duration (minutes)</label>
                  <select {...step3.register("slot_duration_minutes")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]">
                    {[15, 30, 45, 60, 90, 120].map((m) => (<option key={m} value={m}>{m} min</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Available days</label>
                  <div className="flex flex-wrap gap-3">
                    {DAYS.map((day) => (
                      <label key={day} className="flex items-center gap-2">
                        <input type="checkbox" checked={step3.watch("available_days")?.includes(day) ?? false} onChange={(e) => { const cur = step3.getValues("available_days") ?? []; step3.setValue("available_days", e.target.checked ? [...cur, day] : cur.filter((x) => x !== day)); }} className="rounded border-[var(--color-border)] text-[var(--color-primary-ca)] focus:ring-[var(--color-primary-ca)]" />
                        <span className="text-sm text-[var(--color-text)]">{day}</span>
                      </label>
                    ))}
                  </div>
                  {step3.formState.errors.available_days && <p className="text-red-600 text-sm mt-0.5">{step3.formState.errors.available_days.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Time slots</label>
                  {timeSlots.fields.map((field, i) => (
                    <div key={field.id} className="flex gap-2 items-center mb-2">
                      <input type="time" {...step3.register(`time_slots.${i}.start`)} className="border border-[var(--color-border)] rounded-lg px-3 py-2" />
                      <span className="text-[var(--color-text-muted)]">–</span>
                      <input type="time" {...step3.register(`time_slots.${i}.end`)} className="border border-[var(--color-border)] rounded-lg px-3 py-2" />
                      <button type="button" onClick={() => timeSlots.remove(i)} className="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => timeSlots.append({ start: "09:00", end: "10:00" })} className="text-sm text-[var(--color-primary-ca)] hover:underline">+ Add slot</button>
                  {step3.formState.errors.time_slots && <p className="text-red-600 text-sm mt-0.5">{step3.formState.errors.time_slots.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Fee (₹) – Online</label>
                    <input type="number" step="0.01" min={0} {...step3.register("fee_online")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Fee (₹) – In-person</label>
                    <input type="number" step="0.01" min={0} {...step3.register("fee_inperson")} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 focus:border-[var(--color-primary-ca)] focus:ring-1 focus:ring-[var(--color-primary-ca)]" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setCurrentStep(2)} className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]">Back</button>
                  <button type="submit" className={`px-6 py-3 rounded-xl text-sm font-semibold text-white ${CA_THEME.btnPrimary}`}>Save & Continue</button>
                </div>
              </form>
            </>
          )}

          {/* Step 4 – Subscription */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Subscription</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Your profile will be visible to users only when verification is approved, subscription is active, and visibility is ON.</p>
              <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1">
                <li>Fixed subscription fee</li>
                <li>GST invoice generation</li>
                <li>Subscription validity tracking</li>
                <li>Profile auto-disabled if subscription expires</li>
              </ul>
              <p className="text-sm text-[var(--color-text-muted)]">No ranking or promotional benefits.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCurrentStep(3)} className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]">Back</button>
                <Link href="/ca/subscription" className={`inline-flex px-6 py-3 rounded-xl text-sm font-semibold text-white ${CA_THEME.btnPrimary}`}>
                  Go to Subscription
                </Link>
                <button type="button" onClick={() => setCurrentStep(5)} className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 5 – Complete */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">You’re all set</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Your profile will be visible to users once verification is approved, subscription is active, and you turn visibility ON from Settings.</p>
              <p className="text-sm text-[var(--color-text-muted)]">You can edit services, fees, and availability from Settings. Membership number and verified name cannot be changed after approval.</p>
              <button type="button" onClick={() => router.push("/ca/dashboard")} className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-white ${CA_THEME.btnPrimary}`}>
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
