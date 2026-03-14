"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { CAProfileLayout, type CAProfileData } from "@/components/CAProfileLayout";

interface PublicCAProfile extends CAProfileData {
  disclaimer: string | null;
}

export default function PublicCAProfilePage() {
  const params = useParams();
  const caId = params.caId as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["ca", "public", caId],
    queryFn: async () => {
      const res = await api.get<PublicCAProfile>(`/ca/profile/public/${caId}`);
      return res.data;
    },
    enabled: !!caId,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-subtle)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading…</p>
      </main>
    );
  }

  if (error) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return (
        <main className="min-h-screen bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center p-8">
          <p className="text-[var(--color-text)]">CA not found or profile not visible.</p>
          <Link href="/search" className="mt-4 text-sm text-[var(--color-primary-user)] hover:underline">
            Back to search
          </Link>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center p-8">
        <p className="text-[var(--color-error)]">{getApiErrorMessage(error)}</p>
        <Link href="/search" className="mt-4 text-sm text-[var(--color-primary-user)] hover:underline">
          Back to search
        </Link>
      </main>
    );
  }

  if (!data) return null;

  return (
    <CAProfileLayout
      data={data}
      variant="public"
      backLink={
        <Link href="/search" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-user)] hover:underline">
          ← Back to search
        </Link>
      }
      actionButton={
        <Link
          href={`/client/book?caId=${data.id}`}
          className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-[var(--color-primary-ca)] text-white hover:opacity-90"
        >
          Book Now
        </Link>
      }
    />
  );
}
