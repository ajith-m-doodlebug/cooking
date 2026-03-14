"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
  const router = useRouter();
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
      router.replace("/ca/onboarding");
      return null;
    }
    return (
      <main className="p-8">
        <p className="text-red-600">{getApiErrorMessage(error)}</p>
      </main>
    );
  }

  const profile = data?.profile;

  if (profile && !profile.onboarding_complete) {
    router.replace("/ca/onboarding");
    return null;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">CA Dashboard</h1>
      <div className="rounded-lg border border-[var(--color-border)] p-4 max-w-lg bg-white">
        <div className="font-semibold text-[var(--color-text)]">{profile?.full_name}</div>
        <div className="text-sm text-[var(--color-text-muted)] mt-1">
          Verification: <span className="font-medium">{profile?.verification_status}</span>
        </div>
        <div className="text-sm text-[var(--color-text-muted)]">
          Visible in search: {profile?.is_visible ? "Yes" : "No"}
        </div>
        <Link
          href="/ca/profile/preview"
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary-ca)] text-white hover:opacity-90"
        >
          Go to profile
        </Link>
      </div>
    </main>
  );
}
