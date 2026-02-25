"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface SubStatus {
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
}

export default function CASubscriptionPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["subscriptions", "status"],
    queryFn: async () => {
      const res = await api.get<SubStatus>("/subscriptions/status");
      return res.data;
    },
  });

  if (isLoading) return <main className="p-8"><p className="text-gray-500">Loading…</p></main>;
  if (error) {
    return <main className="p-8"><p className="text-red-600">{getApiErrorMessage(error)}</p></main>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Subscription</h1>
      <div className="rounded-lg border p-4 max-w-md">
        <p className="font-medium">Status: {data?.is_active ? "Active" : "Inactive"}</p>
        {data?.end_date && <p className="text-sm text-gray-600">Ends: {data.end_date}</p>}
        {data?.days_remaining != null && <p className="text-sm text-gray-600">{data.days_remaining} days remaining</p>}
        {!data?.is_active && (
          <p className="mt-2 text-sm text-gray-500">
            Subscribe to become visible and accept bookings. Initiate subscription from API or add UI here.
          </p>
        )}
      </div>
    </main>
  );
}
