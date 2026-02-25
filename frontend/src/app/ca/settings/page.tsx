"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface BankDetails {
  id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string | null;
  upi_id: string | null;
}

export default function CASettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "bank"],
    queryFn: async () => {
      const res = await api.get<BankDetails>("/settings/bank");
      return res.data;
    },
  });

  if (isLoading) return <main className="p-8"><p className="text-gray-500">Loading…</p></main>;
  if (error) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return (
        <main className="p-8">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-gray-600">No bank details yet. Add bank details for payouts (form can be added here).</p>
        </main>
      );
    }
    return <main className="p-8"><p className="text-red-600">Failed to load settings</p></main>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="rounded-lg border p-4 max-w-md mb-6">
        <h2 className="font-medium mb-2">Bank details</h2>
        <p className="text-sm">{data?.account_holder_name}</p>
        <p className="text-sm text-gray-600">••••{data?.account_number?.slice(-4)} · {data?.ifsc_code}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            const res = await api.get("/settings/settlements/download", { responseType: "blob" });
            const url = URL.createObjectURL(res.data as Blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "settlements.csv";
            a.click();
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }}
        className="text-blue-600 hover:underline"
      >
        Download settlements CSV
      </button>
    </main>
  );
}
