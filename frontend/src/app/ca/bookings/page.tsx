"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

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

export default function CABookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", "ca"],
    queryFn: async () => {
      const res = await api.get<BookingsResponse>("/bookings/ca", { params: { page: 1, size: 20 } });
      return res.data;
    },
  });

  if (isLoading) return <div className="p-8"><p className="text-gray-500">Loading…</p></div>;
  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{getApiErrorMessage(error)}</p>
      </div>
    );
  }
  const items = data?.items ?? [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li key={b.id} className="border rounded p-3">
              <div className="font-medium">{b.service}</div>
              <div className="text-sm text-gray-600">
                {b.booking_date} {b.slot_start}–{b.slot_end} · {b.status}
              </div>
              {b.meeting_join_url && (
                <a href={b.meeting_join_url} target="_blank" rel="noreferrer" className="text-sm text-[var(--color-link)] hover:underline">
                  Join meeting
                </a>
              )}
              <Link href={`/ca/bookings/${b.id}`} className="ml-4 text-sm text-[var(--color-link)] hover:underline">Details</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
