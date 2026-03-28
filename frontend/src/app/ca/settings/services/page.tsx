"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

const SERVICES = ["GST Filing", "Income Tax (ITR)", "TDS / TCS", "Audit & Assurance", "Company Law & Compliance", "ROC Filings", "Tax Planning", "Accounting & Bookkeeping", "Other"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"];
const EXPERIENCE_OPTIONS = [1, 3, 5, 10, 99];

const schema = z.object({
  services: z.array(z.string()).min(1, "Select at least one service"),
  consultation_mode: z.enum(["ONLINE", "IN_PERSON", "BOTH"]),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  experience_years: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface CAProfileResponse {
  profile: unknown;
  services: { services: string[]; consultation_mode: string; languages: string[]; experience_years: number | null } | null;
}

export default function EditServicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { services: [], consultation_mode: "BOTH", languages: [], experience_years: undefined },
  });

  const { data } = useQuery({
    queryKey: ["ca", "profile"],
    queryFn: async () => {
      const res = await api.get<CAProfileResponse>("/ca/profile");
      return res.data;
    },
  });

  useEffect(() => {
    const svc = data?.services;
    if (!svc) return;
    form.reset({
      services: svc.services ?? [],
      consultation_mode: (svc.consultation_mode as "ONLINE" | "IN_PERSON" | "BOTH") ?? "BOTH",
      languages: svc.languages ?? [],
      experience_years: svc.experience_years ?? undefined,
    });
  }, [data?.services, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api.put("/ca/profile/services", values);
      queryClient.invalidateQueries({ queryKey: ["ca", "profile"] });
      router.push("/ca/settings");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  });

  return (
    <main className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Edit services</h1>
      <p className="text-gray-600 mb-6">Update services offered, consultation mode, languages, and experience. You cannot edit membership number or verified name.</p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Services offered</label>
          <div className="space-y-2">
            {SERVICES.map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.watch("services")?.includes(s) ?? false}
                  onChange={(e) => {
                    const cur = form.getValues("services") ?? [];
                    form.setValue("services", e.target.checked ? [...cur, s] : cur.filter((x) => x !== s));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Consultation mode</label>
          <div className="flex gap-4">
            {(["ONLINE", "IN_PERSON", "BOTH"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" {...form.register("consultation_mode")} value={m} className="rounded-full" />
                <span className="text-sm">{m === "BOTH" ? "Both" : m === "ONLINE" ? "Online" : "In-person"}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Languages</label>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.watch("languages")?.includes(lang) ?? false}
                  onChange={(e) => {
                    const cur = form.getValues("languages") ?? [];
                    form.setValue("languages", e.target.checked ? [...cur, lang] : cur.filter((x) => x !== lang));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{lang}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Experience (years)</label>
          <select {...form.register("experience_years")} className="w-full border rounded-lg px-3 py-2">
            <option value="">Select</option>
            {EXPERIENCE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n === 99 ? "10+" : n}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <Link href="/ca/settings" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
          <button type="submit" className="px-4 py-2 bg-[var(--color-primary-ca)] text-white rounded-lg hover:bg-[var(--color-primary-ca-hover)]">Save</button>
        </div>
      </form>
    </main>
  );
}
