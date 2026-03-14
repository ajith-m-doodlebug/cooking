"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface BankDetails {
  id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string | null;
  upi_id: string | null;
}

interface CAProfileInfo {
  profile: {
    id: string;
    verification_status: string;
    is_visible: boolean;
  };
}

export default function CASettingsPage() {
  const queryClient = useQueryClient();

  const { data: bankData, isLoading: bankLoading, error: bankError } = useQuery({
    queryKey: ["settings", "bank"],
    queryFn: async () => {
      const res = await api.get<BankDetails>("/settings/bank");
      return res.data;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: ["ca", "profile"],
    queryFn: async () => {
      const res = await api.get<CAProfileInfo>("/ca/profile");
      return res.data;
    },
  });

  const profile = profileData?.profile;
  const isVerified = profile?.verification_status === "VERIFIED";

  const handleVisibilityToggle = async (is_visible: boolean) => {
    try {
      await api.put("/ca/profile/visibility", { is_visible });
      queryClient.invalidateQueries({ queryKey: ["ca", "profile"] });
    } catch {
      // Error could be shown via toast
    }
  };

  if (bankLoading) {
    return (
      <main className="p-8">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profile management</h1>

      {/* Visibility toggle */}
      <div className="rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-2">Visibility</h2>
        <p className="text-sm text-gray-600 mb-3">
          Turn your profile ON or OFF for client search. You can edit services, fees, and availability anytime. Membership number, COP number, and verified name cannot be edited after approval.
        </p>
        {isVerified ? (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={profile?.is_visible ?? false}
                onChange={(e) => handleVisibilityToggle(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">Profile visible to clients</span>
            </label>
          </div>
        ) : (
          <p className="text-sm text-amber-700">
            Verify your ICAI details in Onboarding to enable visibility.
          </p>
        )}
      </div>

      {/* Edit services / booking */}
      <div className="rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-2">Edit profile</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/ca/settings/services" className="text-blue-600 hover:underline">
              Edit services (offered, consultation mode, languages, experience)
            </Link>
          </li>
          <li>
            <Link href="/ca/settings/booking" className="text-blue-600 hover:underline">
              Edit fees & availability (slot duration, days, time slots, fee online/in-person)
            </Link>
          </li>
          <li>
            <Link href="/ca/profile/preview" className="text-blue-600 hover:underline">
              View public profile (preview how clients see you)
            </Link>
          </li>
        </ul>
      </div>

      {/* Bank details */}
      <div className="rounded-lg border p-4 max-w-md mb-6">
        <h2 className="font-semibold mb-2">Bank details</h2>
        {bankError && (bankError as { response?: { status?: number } }).response?.status !== 404 && (
          <p className="text-red-600 text-sm mb-2">{getApiErrorMessage(bankError)}</p>
        )}
        {(bankError as { response?: { status?: number } })?.response?.status === 404 ? (
          <p className="text-gray-600 text-sm">No bank details yet. Add bank details for payouts.</p>
        ) : bankData ? (
          <>
            <p className="text-sm">{bankData.account_holder_name}</p>
            <p className="text-sm text-gray-600">
              ••••{bankData.account_number?.slice(-4)} · {bankData.ifsc_code}
            </p>
          </>
        ) : null}
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
        className="text-blue-600 hover:underline text-sm"
      >
        Download settlements CSV
      </button>
    </main>
  );
}
