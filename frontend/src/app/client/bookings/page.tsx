"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { USER_THEME } from "@/lib/theme";

interface Booking {
  id: string;
  ca_id: string;
  user_id: string;
  service: string;
  consultation_mode: string;
  booking_date: string;
  slot_start: string;
  slot_end: string;
  fee_ca: number;
  status: string;
  meeting_join_url: string | null;
  created_at: string;
}

interface BookingsResponse {
  items: Booking[];
  total: number;
  page: number;
  size: number;
}

export default function ClientBookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", "user"],
    queryFn: async () => {
      const res = await api.get<BookingsResponse>("/bookings/user", { params: { page: 1, size: 20 } });
      return res.data;
    },
  });

  if (isLoading) return <div className={`p-8 ${USER_THEME.bg}`}><p className={USER_THEME.textMuted}>Loading…</p></div>;
  if (error) {
    return (
      <div className={`p-8 ${USER_THEME.bg}`}>
        <p className="text-red-600">{getApiErrorMessage(error)}</p>
      </div>
    );
  }
  const items = data?.items ?? [];

  return (
    <div className={`p-8 ${USER_THEME.bg} min-h-[60vh]`}>
      <h1 className={`text-2xl font-bold mb-4 ${USER_THEME.text}`}>My Bookings</h1>
      {items.length === 0 ? (
        <p className={USER_THEME.textMuted}>
          No bookings yet. <Link href="/search" className={USER_THEME.primaryText + " hover:underline"}>Search CAs</Link> to book.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li key={b.id} className={`${USER_THEME.card} rounded-xl p-4`}>
              <div className="font-medium text-[var(--color-text)]">{b.service}</div>
              <div className={`text-sm ${USER_THEME.textMuted}`}>
                {b.booking_date} {b.slot_start}–{b.slot_end} · {b.status}
              </div>
              {b.meeting_join_url && (
                <a href={b.meeting_join_url} target="_blank" rel="noreferrer" className={`text-sm ${USER_THEME.primaryText} hover:underline`}>
                  Join meeting
                </a>
              )}
              <Link href={`/client/bookings/${b.id}`} className={`ml-4 text-sm ${USER_THEME.primaryText} hover:underline`}>Details · Invoice</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
