"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface PublicCAProfile {
  id: string;
  full_name: string;
  icai_membership_number: string;
  year_of_qualification: number | null;
  firm_name: string | null;
  services: string[];
  consultation_mode: string;
  languages: string[];
  experience_years: number | null;
  fee_online: number | null;
  fee_inperson: number | null;
  available_days: string[];
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

  if (isLoading) return <main className="p-8"><p className="text-gray-500">Loading…</p></main>;
  if (error) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return (
        <main className="p-8">
          <p className="text-gray-600">CA not found or profile not visible.</p>
          <Link href="/search" className="text-blue-600 mt-2 inline-block">Back to search</Link>
        </main>
      );
    }
    return (
      <main className="p-8">
        <p className="text-red-600">{getApiErrorMessage(error)}</p>
        <Link href="/search" className="text-blue-600 mt-2 inline-block">Back to search</Link>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <Link href="/search" className="text-blue-600 hover:underline mb-4 inline-block">← Back to search</Link>
      <h1 className="text-2xl font-bold mb-2">{data?.full_name}</h1>
      <div className="text-gray-600 text-sm mb-4">
        ICAI #{data?.icai_membership_number}
        {data?.firm_name && ` · ${data.firm_name}`}
        {data?.year_of_qualification && ` · Qualified ${data.year_of_qualification}`}
      </div>
      <div className="rounded-lg border p-4 space-y-2">
        <p><span className="font-medium">Services:</span> {data?.services?.join(", ")}</p>
        <p><span className="font-medium">Mode:</span> {data?.consultation_mode}</p>
        <p><span className="font-medium">Languages:</span> {data?.languages?.join(", ") || "—"}</p>
        {data?.experience_years != null && <p><span className="font-medium">Experience:</span> {data.experience_years} years</p>}
        <p>
          <span className="font-medium">Fees:</span>{" "}
          {data?.fee_online != null && `Online ₹${data.fee_online}`}
          {data?.fee_online != null && data?.fee_inperson != null && " · "}
          {data?.fee_inperson != null && `In-person ₹${data.fee_inperson}`}
        </p>
        <p><span className="font-medium">Available days:</span> {data?.available_days?.join(", ") || "—"}</p>
      </div>
      {data?.disclaimer && (
        <p className="mt-4 text-sm text-gray-500">{data.disclaimer}</p>
      )}
      <Link
        href={`/client/book?caId=${data?.id}`}
        className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Book consultation
      </Link>
    </main>
  );
}
