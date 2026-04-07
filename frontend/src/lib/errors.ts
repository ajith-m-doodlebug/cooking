import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Something went wrong";
  const ax = error as AxiosError<ApiErrorBody>;
  const body = ax.response?.data;
  if (body?.error?.message) return body.error.message;
  if (ax.response?.status === 403) return "Access denied.";
  if (ax.response?.status === 404) return "Resource not found.";
  if (ax.response?.status === 422) {
    const detail = body?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      const msg = typeof first === "object" && first && "msg" in first ? String((first as { msg?: string }).msg) : null;
      if (msg) return msg;
    }
    return body?.error?.message ?? "Validation error.";
  }
  if (body?.error?.code === "PAYMENT_ERROR") return body.error.message ?? "Payment failed.";
  if (body?.error?.code === "PROVIDER_ERROR")
    return body.error.message ?? "Payment service error. Check API logs and gateway configuration.";
  if (body?.error?.code === "INTERNAL_ERROR") return "Something went wrong. Please try again.";
  return body?.error?.message ?? ax.message ?? "Something went wrong.";
}
