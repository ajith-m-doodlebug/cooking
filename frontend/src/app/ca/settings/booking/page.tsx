"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const optionalInr = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}, z.number().min(0).nullable().optional());

const schema = z.object({
  slot_duration_minutes: z.coerce.number().int().min(15).max(120),
  available_days: z.array(z.string()).min(1, "Select at least one day"),
  time_slots: z.array(z.object({ start: z.string(), end: z.string() })).min(1, "Add at least one slot"),
  fee_online: optionalInr,
  fee_inperson: optionalInr,
});

type FormValues = z.infer<typeof schema>;

interface CAProfileResponse {
  profile: unknown;
  booking: {
    slot_duration_minutes: number;
    available_days: string[];
    time_slots: { start: string; end: string }[];
    fee_online: number | null;
    fee_inperson: number | null;
  } | null;
}

export default function EditBookingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slot_duration_minutes: 30,
      available_days: [],
      time_slots: [{ start: "09:00", end: "10:00" }],
      fee_online: undefined,
      fee_inperson: undefined,
    },
  });
  const timeSlots = useFieldArray({ control: form.control, name: "time_slots" });

  const { data } = useQuery({
    queryKey: ["ca", "profile"],
    queryFn: async () => {
      const res = await api.get<CAProfileResponse>("/ca/profile");
      return res.data;
    },
  });

  useEffect(() => {
    const bk = data?.booking;
    if (!bk) return;
    form.reset({
      slot_duration_minutes: bk.slot_duration_minutes,
      available_days: bk.available_days ?? [],
      time_slots: bk.time_slots?.length ? bk.time_slots : [{ start: "09:00", end: "10:00" }],
      fee_online: bk.fee_online ?? undefined,
      fee_inperson: bk.fee_inperson ?? undefined,
    });
  }, [data?.booking, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api.put("/ca/profile/booking", values);
      queryClient.invalidateQueries({ queryKey: ["ca", "profile"] });
      router.push("/ca/settings");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  });

  return (
    <main className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Edit fees & availability</h1>
      <p className="text-gray-600 mb-6">Update slot duration, available days, time slots, and fees (online/in-person).</p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Slot duration (min)</label>
          <select {...form.register("slot_duration_minutes")} className="w-full border rounded-lg px-3 py-2">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Available days</label>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.watch("available_days")?.includes(day) ?? false}
                  onChange={(e) => {
                    const cur = form.getValues("available_days") ?? [];
                    form.setValue("available_days", e.target.checked ? [...cur, day] : cur.filter((x) => x !== day));
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{day}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Time slots</label>
          {timeSlots.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-center mb-2">
              <input type="time" {...form.register(`time_slots.${i}.start`)} className="border rounded-lg px-3 py-2" />
              <span className="text-gray-500">–</span>
              <input type="time" {...form.register(`time_slots.${i}.end`)} className="border rounded-lg px-3 py-2" />
              <button type="button" onClick={() => timeSlots.remove(i)} className="text-red-600 text-sm hover:underline">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => timeSlots.append({ start: "09:00", end: "10:00" })} className="text-sm text-[var(--color-link)] hover:underline">+ Add slot</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fee (₹) – Online</label>
            <input type="number" step="0.01" min="0" {...form.register("fee_online")} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fee (₹) – In-person</label>
            <input type="number" step="0.01" min="0" {...form.register("fee_inperson")} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/ca/settings" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
          <button type="submit" className="px-4 py-2 bg-[var(--color-primary-ca)] text-white rounded-lg hover:bg-[var(--color-primary-ca-hover)]">Save</button>
        </div>
      </form>
    </main>
  );
}
