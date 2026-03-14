"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { CAProfileLayout, type CAProfileData } from "@/components/CAProfileLayout";

interface PreviewData extends CAProfileData {
  visible_to_clients: boolean;
}

export default function CAProfilePreviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ca", "profile", "preview"],
    queryFn: async () => {
      const res = await api.get<PreviewData>("/ca/profile/preview");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-subtle)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center p-8">
        <p className="text-[var(--color-error)]">{getApiErrorMessage(error)}</p>
        <Link href="/ca/settings" className="mt-4 text-sm text-[var(--color-primary-ca)] hover:underline">
          Back to Settings
        </Link>
      </main>
    );
  }

  if (!data) return null;

  return (
    <CAProfileLayout
      data={data}
      variant="preview"
      visibilityBanner={
        !data.visible_to_clients ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 mb-6 text-sm text-amber-900">
            Your profile is not visible to clients yet. Ensure verification is approved, subscription is active, and visibility is ON in Settings.
          </div>
        ) : undefined
      }
      backLink={
        <Link href="/ca/settings" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-ca)] hover:underline">
          ← Back to Settings
        </Link>
      }
      actionButton={
        <div className="flex flex-col gap-2">
          <Link
            href="/ca/settings"
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary-ca)] text-white hover:opacity-90"
          >
            Edit profile
          </Link>
          <Link
            href="/ca/settings/services"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-ca)] hover:underline text-center"
          >
            Edit services & fees
          </Link>
        </div>
      }
    />
  );
}
