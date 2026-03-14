"use client";

/**
 * CA profile layout — matches Figma: left (photo + contact), center (name, services, overview), right (Book an Appointment + time slots).
 * Uses global colors only: same bg, text, light grey and yellow as login page.
 */

export interface TimeSlotDisplay {
  start: string;
  end: string;
}

export interface CAProfileData {
  id: string;
  full_name: string;
  icai_membership_number: string;
  year_of_qualification: number | null;
  firm_name: string | null;
  registered_office_address?: string | null;
  services: string[];
  consultation_mode: string;
  languages: string[];
  experience_years: number | null;
  fee_online: number | null;
  fee_inperson: number | null;
  available_days: string[];
  time_slots?: TimeSlotDisplay[];
  slot_duration_minutes?: number;
  disclaimer?: string | null;
}

const consultationLabel: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "In-person",
  BOTH: "Online & In-person",
};

function formatTimeSlot(s: string): string {
  const [h, m] = s.split(":").map(Number);
  if (h === 0) return "12:" + (m ? String(m).padStart(2, "0") : "00") + " AM";
  if (h === 12) return "12:" + (m ? String(m).padStart(2, "0") : "00") + " PM";
  if (h < 12) return h + ":" + (m ? String(m).padStart(2, "0") : "00") + " AM";
  return h - 12 + ":" + (m ? String(m).padStart(2, "0") : "00") + " PM";
}

function groupTimeSlots(slots: TimeSlotDisplay[]): { morning: TimeSlotDisplay[]; day: TimeSlotDisplay[] } {
  const morning: TimeSlotDisplay[] = [];
  const day: TimeSlotDisplay[] = [];
  for (const s of slots) {
    const hour = parseInt(s.start.slice(0, 2), 10);
    if (hour < 12) morning.push(s);
    else day.push(s);
  }
  return { morning, day };
}

export function CAProfileLayout({
  data,
  variant,
  visibilityBanner,
  actionButton,
  backLink,
}: {
  data: CAProfileData;
  variant: "preview" | "public";
  visibilityBanner?: React.ReactNode;
  actionButton: React.ReactNode;
  backLink?: React.ReactNode;
}) {
  const timeSlots = data.time_slots ?? [];
  const { morning: morningSlots, day: daySlots } = groupTimeSlots(timeSlots);
  const slotDuration = data.slot_duration_minutes ?? 30;

  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)]">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {backLink && <div className="mb-4">{backLink}</div>}
        {visibilityBanner}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column — Photo + contact (Figma style) */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm overflow-hidden">
              <div className="h-48 bg-[var(--color-card-bg)] flex items-center justify-center">
                <span className="text-5xl font-bold text-[var(--color-text-muted)]">CA</span>
              </div>
              <div className="p-5 space-y-3">
                {(data.firm_name || data.registered_office_address) && (
                  <div className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                    <span className="text-[var(--color-text-muted)] shrink-0" aria-hidden>📍</span>
                    <span>
                      {[data.firm_name, data.registered_office_address].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <span className="shrink-0" aria-hidden>#</span>
                  <span>ICAI {data.icai_membership_number}</span>
                </div>
                {data.year_of_qualification != null && (
                  <p className="text-sm text-[var(--color-text-muted)]">Qualified {data.year_of_qualification}</p>
                )}
                {data.languages?.length > 0 && (
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Languages</p>
                    <ul className="space-y-1 text-sm text-[var(--color-text)]">
                      {data.languages.map((lang) => (
                        <li key={lang}>• {lang}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center column — Name, services, overview (Figma style) */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{data.full_name}</h1>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mt-1">
                {data.services?.length ? data.services.join(", ") : "Chartered Accountant"}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--color-primary-ca)]/15 border border-[var(--color-primary-ca)]/30 p-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Chartered Accountant
                {data.experience_years != null && (
                  <> · {data.experience_years === 99 ? "10+" : data.experience_years} years experience</>
                )}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {consultationLabel[data.consultation_mode] ?? data.consultation_mode} · Slot duration {slotDuration} min
              </p>
            </div>

            <div className="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-4">
              <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Profile overview</h2>
              <p className="text-sm text-[var(--color-text)]">
                {data.full_name} is a Chartered Accountant offering {data.services?.slice(0, 3).join(", ")}
                {data.services?.length > 3 ? " and more" : ""}. Consultation available {consultationLabel[data.consultation_mode]?.toLowerCase() ?? ""}.
                {data.available_days?.length ? ` Available on ${data.available_days.join(", ")}.` : ""}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Services & experience</h2>
              <div className="flex flex-wrap gap-2 mb-2">
                {data.services?.length
                  ? data.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary-ca)]/10 text-[var(--color-primary-ca)]"
                      >
                        {s}
                      </span>
                    ))
                  : "—"}
              </div>
              <p className="text-sm text-[var(--color-text)]">
                Mode: {consultationLabel[data.consultation_mode] ?? data.consultation_mode}
                {data.experience_years != null && ` · Experience: ${data.experience_years === 99 ? "10+" : data.experience_years} years`}
              </p>
            </div>

            {data.disclaimer && (
              <p className="text-xs text-[var(--color-text-muted)]">{data.disclaimer}</p>
            )}
          </div>

          {/* Right column — Book an Appointment (Figma style: light grey card, calendar, time slots, yellow button) */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-sm p-5 sticky top-4">
              <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
                {variant === "public" ? "Book an Appointment" : "Booking details"}
              </h2>

              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Available days</p>
                <p className="text-sm text-[var(--color-text)]">
                  {data.available_days?.length ? data.available_days.join(", ") : "—"}
                </p>
              </div>

              {timeSlots.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Time</p>
                  {morningSlots.length > 0 && (
                    <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Morning</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {morningSlots.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center justify-center min-w-[5rem] px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
                      >
                        {formatTimeSlot(s.start)}
                      </span>
                    ))}
                  </div>
                  {daySlots.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Day</p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center justify-center min-w-[5rem] px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
                          >
                            {formatTimeSlot(s.start)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {data.fee_online != null && (
                  <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Fee (Online)</p>
                    <p className="text-lg font-semibold text-[var(--color-text)]">₹{data.fee_online}</p>
                  </div>
                )}
                {data.fee_inperson != null && (
                  <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Fee (In-person)</p>
                    <p className="text-lg font-semibold text-[var(--color-text)]">₹{data.fee_inperson}</p>
                  </div>
                )}
              </div>
              {variant === "public" && (data.fee_online != null || data.fee_inperson != null) && (
                <p className="text-xs text-[var(--color-text-muted)] mb-4">Fees may vary by service.</p>
              )}

              <div className="mt-4">{actionButton}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
