// Auth
export type UserRole = "CA" | "USER";

// CA
export type VerificationStatus = "PENDING" | "VERIFIED" | "FAILED";
export type ConsultationMode = "ONLINE" | "IN_PERSON" | "BOTH";

// Bookings
export type BookingStatus =
  | "SLOT_LOCKED"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_CA"
  | "COMPLETED";

// Payments
export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

// API shapes
export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  is_phone_verified: boolean;
  terms_accepted: boolean;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthGoogleResponse {
  user: User;
  tokens: Tokens;
  is_new_user: boolean;
}

export interface ApiErrorBody {
  error?: { code: string; message: string };
  detail?: unknown;
}
