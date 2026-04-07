/** Load Razorpay Standard Checkout and open an order created via the backend Orders API. */

export type RazorpayGatewayData = {
  provider?: string;
  key?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
};

export type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCtor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, fn: (arg: unknown) => void) => void;
};

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout runs in the browser only"));
  }
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Opens Razorpay modal for a server-created order. On success, call your API with the returned ids + signature.
 */
export async function openRazorpayOrderModal(
  gatewayData: RazorpayGatewayData,
  options: {
    title: string;
    description: string;
    onSuccess: (payload: RazorpaySuccessPayload) => void;
    onFailure?: (message: string) => void;
    onDismiss?: () => void;
  }
): Promise<void> {
  await loadRazorpayScript();
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  const Razorpay = w.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay failed to initialize");
  }

  const key =
    (typeof gatewayData.key === "string" && gatewayData.key) ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";
  const orderId = gatewayData.order_id;
  if (!key) {
    throw new Error("Missing Razorpay key (gateway_data.key or NEXT_PUBLIC_RAZORPAY_KEY_ID)");
  }
  if (!orderId || typeof orderId !== "string") {
    throw new Error("Missing Razorpay order_id from server");
  }
  const amount = gatewayData.amount;
  if (amount == null || Number.isNaN(Number(amount))) {
    throw new Error("Missing order amount from server");
  }

  const rzp = new Razorpay({
    key,
    amount: String(amount),
    currency: (gatewayData.currency as string) || "INR",
    name: options.title,
    description: options.description,
    order_id: orderId,
    handler(response: RazorpaySuccessPayload) {
      options.onSuccess(response);
    },
    modal: {
      ondismiss() {
        options.onDismiss?.();
      },
    },
    theme: { color: "#1e3a5f" },
  });

  rzp.on("payment.failed", (raw: unknown) => {
    const err = raw as { error?: { description?: string; reason?: string } };
    const msg =
      err?.error?.description || err?.error?.reason || "Payment failed";
    options.onFailure?.(msg);
  });

  rzp.open();
}
