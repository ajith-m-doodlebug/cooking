"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ClientBookPage() {
  const searchParams = useSearchParams();
  const caId = searchParams.get("caId");

  if (!caId) {
    return (
      <main className="p-8">
        <p className="text-gray-600">No CA selected.</p>
        <Link href="/search" className="text-blue-600 hover:underline">Search CAs</Link>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Book consultation</h1>
      <p className="text-gray-600 mb-4">
        Choose service, date and slot, then lock the slot and complete payment (Razorpay). Full flow: POST /bookings/lock-slot → POST /payments/booking/initiate/{"{booking_id}"} → gateway → POST /payments/booking/webhook.
      </p>
      <Link href={`/ca/public/${caId}`} className="text-blue-600 hover:underline">Back to CA profile</Link>
    </main>
  );
}
