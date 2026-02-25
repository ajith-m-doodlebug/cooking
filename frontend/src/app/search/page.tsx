"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface CASearchItem {
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

interface SearchResponse {
  items: CASearchItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function SearchPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", "ca", 1, 20],
    queryFn: async () => {
      const res = await api.get<SearchResponse>("/search/ca", {
        params: { page: 1, size: 20 },
      });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">{getApiErrorMessage(error)}</p>
        <Link href="/" className="text-blue-600 mt-4 inline-block">Back to home</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Find a CA</h1>
        <Link href="/" className="text-blue-600 hover:underline">Home</Link>
      </div>
      <ul className="space-y-4">
        {data?.items?.length === 0 ? (
          <li className="text-gray-500">No CAs found.</li>
        ) : (
          data?.items?.map((ca) => (
            <li key={ca.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <Link href={`/ca/public/${ca.id}`} className="block">
                <div className="font-semibold">{ca.full_name}</div>
                <div className="text-sm text-gray-600">
                  ICAI #{ca.icai_membership_number}
                  {ca.firm_name && ` · ${ca.firm_name}`}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {ca.services?.join(", ")} · {ca.consultation_mode}
                  {ca.fee_online != null && ` · ₹${ca.fee_online} online`}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
      {data && data.pages > 1 && (
        <p className="mt-4 text-sm text-gray-500">
          Page {data.page} of {data.pages} ({data.total} total)
        </p>
      )}
    </main>
  );
}
