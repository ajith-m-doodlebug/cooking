"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface CAProfile {
  profile: {
    id: string;
    user_id: string;
    full_name: string;
    verification_status: string;
    is_visible: boolean;
    onboarding_complete: boolean;
  };
  services: unknown;
  booking: unknown;
}

export default function CADashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ca", "profile"],
    queryFn: async () => {
      const res = await api.get<CAProfile>("/ca/profile");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <main className="p-8">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (error) {
    const err = error as { response?: { status?: number; data?: { error?: { message?: string; code?: string } } } };
    if (err.response?.status === 404 || err.response?.data?.error?.code === "NOT_FOUND") {
      return (
        <main className="p-8">
          <p className="mb-4">Complete onboarding to access your dashboard.</p>
          <Link href="/ca/onboarding" className="text-blue-600 hover:underline">
            Go to onboarding
          </Link>
        </main>
      );
    }
    return (
      <main className="p-8">
        <p className="text-red-600">{getApiErrorMessage(error)}</p>
      </main>
    );
  }

  const profile = data?.profile;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">CA Dashboard</h1>
      {!profile?.onboarding_complete ? (
        <p className="mb-4">
          Complete onboarding to start receiving bookings.
          <Link href="/ca/onboarding" className="ml-2 text-blue-600 hover:underline">
            Onboard now
          </Link>
        </p>
      ) : null}
      <div className="rounded-lg border p-4 max-w-lg">
        <div className="font-semibold">{profile?.full_name}</div>
        <div className="text-sm text-gray-600 mt-1">
          Verification: <span className="font-medium">{profile?.verification_status}</span>
        </div>
        <div className="text-sm text-gray-600">
          Visible in search: {profile?.is_visible ? "Yes" : "No"}
        </div>
      </div>
    </main>
  );
}
