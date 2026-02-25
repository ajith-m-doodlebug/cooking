"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

const step1Schema = z.object({
  full_name: z.string().min(1, "Name required"),
  icai_membership_number: z.string().length(6, "Must be 6 digits"),
  cop_number: z.string().optional(),
  year_of_qualification: z.coerce.number().optional(),
  firm_name: z.string().optional(),
  registered_office_address: z.string().optional(),
});

type Step1Form = z.infer<typeof step1Schema>;

export default function CAOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      full_name: "",
      icai_membership_number: "",
    },
  });

  const onStep1 = step1.handleSubmit(async (data) => {
    setError(null);
    try {
      await api.post("/ca/onboarding/verification", data);
      setStep(2);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    }
  });

  return (
    <main className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">CA Onboarding</h1>
      {step === 1 && (
        <form onSubmit={onStep1} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              {...step1.register("full_name")}
              className="w-full border rounded px-3 py-2"
            />
            {step1.formState.errors.full_name && (
              <p className="text-red-600 text-sm">{step1.formState.errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ICAI membership number (6 digits)</label>
            <input
              {...step1.register("icai_membership_number")}
              className="w-full border rounded px-3 py-2"
              maxLength={6}
            />
            {step1.formState.errors.icai_membership_number && (
              <p className="text-red-600 text-sm">{step1.formState.errors.icai_membership_number.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year of qualification (optional)</label>
            <input
              type="number"
              {...step1.register("year_of_qualification")}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Firm name (optional)</label>
            <input
              {...step1.register("firm_name")}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit verification
          </button>
        </form>
      )}
      {step === 2 && (
        <p className="text-gray-600">
          Verification submitted. You can complete services and booking settings from your dashboard.
          <button
            type="button"
            onClick={() => router.push("/ca/dashboard")}
            className="ml-2 text-blue-600 hover:underline"
          >
            Go to dashboard
          </button>
        </p>
      )}
    </main>
  );
}
