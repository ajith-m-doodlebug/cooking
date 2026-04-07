"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import {
  openRazorpayOrderModal,
  type RazorpayGatewayData,
} from "@/lib/razorpay-checkout";

interface SubStatus {
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
}

interface InitiateResponse {
  subscription_id: string;
  gateway_data: Record<string, unknown>;
  amount: number;
  gst_amount: number;
  total_amount: number;
}

interface InvoiceItem {
  id: string;
  invoice_number: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  start_date: string | null;
  end_date: string | null;
}

export default function CASubscriptionPage() {
  const queryClient = useQueryClient();
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [lastInitiate, setLastInitiate] = useState<InitiateResponse | null>(null);

  const { data: status, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ["subscriptions", "status"],
    queryFn: async () => {
      const res = await api.get<SubStatus>("/subscriptions/status");
      return res.data;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["subscriptions", "invoices"],
    queryFn: async () => {
      const res = await api.get<InvoiceItem[]>("/subscriptions/invoices");
      return res.data;
    },
  });

  const handleInitiate = async () => {
    setInitError(null);
    setLastInitiate(null);
    setInitiating(true);
    try {
      const { data } = await api.post<InitiateResponse>("/subscriptions/initiate", {});
      setLastInitiate(data);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      setInitError(getApiErrorMessage(err));
    } finally {
      setInitiating(false);
    }
  };

  const isMockGateway = (gw: Record<string, unknown>) =>
    gw.provider === "mock" || gw.key === "mock_key_id";

  const handleRazorpayPay = async () => {
    if (!lastInitiate) return;
    const gw = lastInitiate.gateway_data as RazorpayGatewayData;
    setInitError(null);
    setInitiating(true);
    try {
      await openRazorpayOrderModal(gw, {
        title: "The Archivist",
        description: "CA platform subscription (incl. GST)",
        onSuccess: async (payload) => {
          setInitiating(true);
          try {
            await api.post("/subscriptions/webhook", {
              order_id: payload.razorpay_order_id,
              payment_id: payload.razorpay_payment_id,
              signature: payload.razorpay_signature,
            });
            setLastInitiate(null);
            await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
          } catch (err) {
            setInitError(getApiErrorMessage(err));
          } finally {
            setInitiating(false);
          }
        },
        onFailure: (msg) => {
          setInitError(msg);
        },
        onDismiss: () => setInitiating(false),
      });
      setInitiating(false);
    } catch (err) {
      setInitError(getApiErrorMessage(err));
      setInitiating(false);
    }
  };

  const handleMockComplete = async () => {
    if (!lastInitiate) return;
    const gw = lastInitiate.gateway_data as Record<string, unknown>;
    const orderId = typeof gw.order_id === "string" ? gw.order_id : null;
    if (!orderId) return;
    setInitError(null);
    setInitiating(true);
    try {
      await api.post("/subscriptions/webhook", {
        order_id: orderId,
        payment_id: "pay_mock_dev",
        signature: "mock",
      });
      setLastInitiate(null);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      setInitError(getApiErrorMessage(err));
    } finally {
      setInitiating(false);
    }
  };

  if (statusLoading) {
    return (
      <main className="p-8">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (statusError) {
    return (
      <main className="p-8">
        <p className="text-red-600">{getApiErrorMessage(statusError)}</p>
      </main>
    );
  }

  const active = status?.is_active ?? false;

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Subscription</h1>
      <p className="text-gray-600 mb-4">
        Fixed platform subscription (no ranking or promotional benefits). GST invoice is issued after successful payment. Your profile appears in search only when you are verified, turn visibility on, and have an active subscription within its validity period.
      </p>
      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-6">
        <li>Fixed subscription fee (+ applicable GST)</li>
        <li>GST invoice generation after payment</li>
        <li>Subscription validity tracking; expired plans hide your profile automatically</li>
        <li>Works together with Page 3 — Booking Details (slot duration, days, time slots, online / in-person fees)</li>
      </ul>

      <div className="rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-2">Status</h2>
        <p className="font-medium">
          {active ? (
            <span className="text-[var(--color-success)]">Active</span>
          ) : (
            <span className="text-[var(--color-primary-ca)]">Inactive</span>
          )}
        </p>
        {status?.end_date && (
          <p className="text-sm text-gray-600 mt-1">
            Valid until: {new Date(status.end_date).toLocaleDateString()}
          </p>
        )}
        {status?.days_remaining != null && active && (
          <p className="text-sm text-gray-600">
            {status.days_remaining} days remaining
          </p>
        )}
      </div>

      {!active && (
        <div className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 mb-6">
          <h2 className="font-semibold mb-2">Subscribe</h2>
          <p className="text-sm text-gray-700 mb-3">
            Pay the fixed subscription fee to activate your profile and accept bookings. GST invoice will be generated after payment.
          </p>
          {initError && (
            <p className="text-red-600 text-sm mb-2">{initError}</p>
          )}
          {lastInitiate ? (
            <div className="space-y-2 text-sm mb-3">
              <p>Amount: ₹{lastInitiate.amount.toLocaleString()}</p>
              <p>GST (18%): ₹{lastInitiate.gst_amount.toLocaleString()}</p>
              <p className="font-medium">Total: ₹{lastInitiate.total_amount.toLocaleString()}</p>
              <p className="text-gray-600">
                Complete payment using the gateway (Razorpay). If you closed the window, start again below.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleInitiate}
              disabled={initiating}
              className="px-4 py-2 bg-[var(--color-primary-ca)] text-white rounded-lg hover:bg-[var(--color-primary-ca-hover)] disabled:opacity-50"
            >
              {initiating ? "Initiating…" : lastInitiate ? "New checkout" : "Subscribe now"}
            </button>
            {lastInitiate && !isMockGateway(lastInitiate.gateway_data as Record<string, unknown>) && (
              <button
                type="button"
                onClick={handleRazorpayPay}
                disabled={initiating}
                className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-95 disabled:opacity-50"
              >
                {initiating ? "Opening checkout…" : "Pay with Razorpay"}
              </button>
            )}
            {lastInitiate && isMockGateway(lastInitiate.gateway_data as Record<string, unknown>) && (
              <button
                type="button"
                onClick={handleMockComplete}
                disabled={initiating}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm font-medium hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
              >
                Complete test payment (mock)
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Test mode uses your Razorpay test keys. After paying, the app confirms the payment with the server. With{" "}
            <code className="bg-gray-100 px-1 rounded">PAYMENT_PROVIDER=mock</code> (or no keys in dev), use the mock
            completion button instead.
          </p>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">GST invoices</h2>
        {Array.isArray(invoices) && invoices.length > 0 ? (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                <span className="font-medium">{inv.invoice_number ?? inv.id}</span>
                <span className="text-gray-600 ml-2">
                  ₹{inv.total_amount?.toLocaleString() ?? "—"} (incl. GST ₹{inv.gst_amount?.toLocaleString() ?? "—"})
                </span>
                {inv.start_date && (
                  <span className="text-gray-500 ml-2">
                    {new Date(inv.start_date).toLocaleDateString()} – {inv.end_date ? new Date(inv.end_date).toLocaleDateString() : "—"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No invoices yet.</p>
        )}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        <Link href="/ca/settings" className="text-[var(--color-link)] hover:underline">
          Settings
        </Link>
        {" · "}
        <Link href="/ca/dashboard" className="text-[var(--color-link)] hover:underline">
          Dashboard
        </Link>
      </p>
    </main>
  );
}
