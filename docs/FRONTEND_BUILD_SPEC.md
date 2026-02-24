# CA Marketplace — Frontend Build Specification

This document is a complete specification for building the frontend for the **CA Marketplace** platform. Use it with a Cursor (or other) agent to implement the UI. The backend is a FastAPI app; this spec describes every API, auth flow, role, and user journey so the frontend can be built end-to-end.

**Backend repo context:** FastAPI, PostgreSQL, Redis, Celery. API base path is `/` (no version prefix). All JSON request/response; dates in ISO 8601 (e.g. `2025-02-20T10:00:00Z` or with timezone).

---

## Table of contents

1. Product overview  
2. Recommended tech stack  
3. Authentication  
4. Error handling  
5. API reference (by module)  
6. Enums and constants  
7. User flows (step-by-step)  
8. Page/screen list and API mapping  
9. Payment gateway (Razorpay) integration  
10. File download  
11. Environment variables (frontend)  
12. Summary checklist for the frontend agent  
13. Optional: OpenAPI and codegen  

---

## 1. Product overview

**CA Marketplace** is a two-sided platform:

- **Clients (USER role):** Discover verified Chartered Accountants (CAs), book consultation slots, pay online, join meetings, view invoices.
- **Chartered Accountants (CA role):** Onboard with ICAI verification, set services/fees/availability, get verified automatically, manage visibility, receive bookings, manage subscription, add bank details, view settlements.

**Backend base URL (development):** `http://localhost:8001`  
**API docs (when `APP_ENV != production`):** `http://localhost:8001/docs` (Swagger), `http://localhost:8001/redoc` (ReDoc).

**CORS:** Backend allows credentials and configurable origins via `ALLOWED_ORIGINS` (e.g. `http://localhost:3000`). Ensure your frontend origin is included in the backend `.env`.

---

## 2. Recommended tech stack

- **Framework:** React (with TypeScript) or Next.js. Next.js recommended if you want SSR/SEO for public CA profiles.
- **State:** React Query (TanStack Query) for server state and caching; Zustand or React Context for auth/user state.
- **Routing:** React Router (or Next.js App Router). Role-based route guards (redirect CA to CA dashboard, USER to client app).
- **Auth:** Store `access_token` and `refresh_token` (e.g. in memory + optional httpOnly cookie or secure storage). Send `Authorization: Bearer <access_token>` on every request. Implement refresh before expiry or on 401.
- **Forms:** React Hook Form + Zod (or Yup) for validation aligned with backend Pydantic rules.
- **HTTP client:** Axios or fetch with an interceptor to attach the token and handle 401 (refresh or logout).
- **UI:** Tailwind CSS or similar. Use a consistent design system; backend has no UI preferences.
- **Payments:** Razorpay (or current provider) — backend returns `gateway_data` (e.g. order_id, key); frontend only opens the gateway UI and, on success/failure, calls the backend webhook/confirm endpoint or redirects with payment_id for confirmation.

---

## 3. Authentication

### 3.1 Roles

- **USER** — Client: search CAs, book, pay, view bookings/invoices, profile, notifications.
- **CA** — Chartered Accountant: onboarding, profile, visibility, verification status, bookings (as provider), subscription, bank details, settlements, notifications.

Role is chosen at first login (Google) and stored on the user; it cannot be changed via the current API.

### 3.2 Auth flow (high level)

1. **Login:** Google OAuth **or** Phone OTP.
2. **After login:** Backend returns `user` + `tokens` (access + refresh). Store tokens; use access token in `Authorization: Bearer <access_token>` for all protected requests.
3. **Token refresh:** When access token expires (or on 401), call `POST /auth/refresh` with `refresh_token`; replace stored tokens with the new ones.
4. **Logout:** Call `POST /auth/logout` (optional; backend just returns success). Clear tokens and user state on the client.

### 3.3 Google OAuth login

- **Endpoint:** `POST /auth/google`
- **Auth:** None.
- **Request body:**

```json
{
  "id_token": "<Google ID token from frontend Google Sign-In>",
  "role": "CA" | "USER"
}
```

- **Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "phone": null | "string",
    "full_name": null | "string",
    "role": "CA" | "USER",
    "is_phone_verified": false,
    "terms_accepted": false
  },
  "tokens": {
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "bearer"
  },
  "is_new_user": false
}
```

- **Notes:** Frontend must integrate Google Sign-In (e.g. `@react-oauth/google`), obtain the **ID token** (not access token), and send it with the chosen **role**. New users get `is_new_user: true`; you may show onboarding or terms flow.

### 3.4 Phone OTP (send)

- **Endpoint:** `POST /auth/phone/send-otp`
- **Auth:** None.
- **Request body:** `{ "phone": "string" }` — digits only, min length 10 (spaces/plus allowed in input; backend validates).
- **Response (200):** `{ "message": "OTP sent successfully" }`

### 3.5 Phone OTP (verify and link to account)

- **Endpoint:** `POST /auth/phone/verify-otp`
- **Auth:** Required (Bearer).
- **Request body:** `{ "phone": "string", "otp": "string" }`
- **Response (200):** `{ "message": "Phone verified successfully" }`
- **Notes:** Use after login to link a phone number to the current user.

### 3.6 Refresh token

- **Endpoint:** `POST /auth/refresh`
- **Auth:** None (uses refresh token in body).
- **Request body:** `{ "refresh_token": "string" }`
- **Response (200):** Same as `TokenResponse`: `{ "access_token", "refresh_token", "token_type": "bearer" }`
- **On 401:** Refresh token invalid or expired; redirect to login and clear storage.

### 3.7 Logout

- **Endpoint:** `POST /auth/logout`
- **Auth:** Optional.
- **Response (200):** `{ "message": "Logged out successfully" }`

---

## 4. Error handling

All API errors that the backend returns follow this shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**Common codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `VALIDATION_ERROR` (422), `PAYMENT_ERROR` (402), `PROVIDER_ERROR` (502), `INTERNAL_ERROR` (500).

**Validation (422):** Request body validation may return FastAPI’s default `detail` array; handle both `error` and `detail` if you want to show field-level errors.

**Strategy:** Use a global HTTP client interceptor: on 401 try refresh once; on 403 show “access denied”; on 404/4xx show error message from `error.message` or `detail`.

---

## 5. API reference (by module)

Base URL for all: `http://localhost:8001` (or your backend URL).

**Auth header for protected routes:** `Authorization: Bearer <access_token>`

---

### 5.1 Health

- **GET /health** — No auth.  
  **Response (200):** `{ "status": "ok", "version": "1.0.0" }`

---

### 5.2 Terms & conditions

- **GET /terms/{role}** — No auth.  
  **Path:** `role` = `CA` | `USER`.  
  **Response (200):**  
  `{ "id", "role", "version", "content" }` (HTML or plain text).  
  **404:** No terms for that role.

- **GET /terms/status** — Auth required.  
  **Response (200):**  
  `{ "has_accepted": boolean, "current_version": string, "accepted_version": string | null }`

- **POST /terms/accept** — Auth required.  
  **Body:** `{ "version": "string" }` — must match current version.  
  **Response (200):** `{ "user_id", "role", "version", "accepted_at" }`  
  **409:** Version mismatch or already accepted.

---

### 5.3 Users (profile)

- **GET /users/me** — Auth required.  
  **Response (200):**  
  `{ "id", "email", "phone", "full_name", "role", "is_phone_verified", "terms_accepted" }`

- **PUT /users/me** — Auth required.  
  **Body:** `{ "full_name": string | null }`  
  **Response (200):** Same shape as GET /users/me.

---

### 5.4 CA (onboarding & profile)

All below (except public profile) require **CA role** (403 if USER).

- **POST /ca/onboarding/verification** — CA.  
  **Body:**  
  `{ "full_name": string, "icai_membership_number": string (exactly 6 digits), "cop_number"?: string, "year_of_qualification"?: number, "firm_name"?: string, "registered_office_address"?: string }`  
  **Example:**  
  `{ "full_name": "Jane Doe", "icai_membership_number": "123456", "year_of_qualification": 2020, "firm_name": "Doe & Co" }`  
  **Response (200):**  
  `{ "id", "user_id", "full_name", "icai_membership_number", "cop_number", "year_of_qualification", "firm_name", "registered_office_address", "verification_status": "PENDING"|"VERIFIED"|"FAILED", "is_visible", "onboarding_complete" }`  
  **Note:** After submit, a background job verifies against ICAI; status may change to VERIFIED or FAILED. Poll GET /verification/status or show “Verification in progress”.

- **POST /ca/onboarding/services** — CA.  
  **Body:**  
  `{ "services": string[], "consultation_mode": "ONLINE"|"IN_PERSON"|"BOTH", "languages": string[], "experience_years"?: number }`  
  **Response (200):**  
  `{ "services", "consultation_mode", "languages", "experience_years" }`

- **POST /ca/onboarding/booking** — CA.  
  **Body:**  
  `{ "slot_duration_minutes"?: 30, "available_days": string[], "time_slots": [ { "start": "HH:MM", "end": "HH:MM" } ], "fee_online"?: number, "fee_inperson"?: number }`  
  **Response (200):**  
  `{ "slot_duration_minutes", "available_days", "time_slots", "fee_online", "fee_inperson" }`

- **GET /ca/profile** — CA.  
  **Response (200):**  
  `{ "profile": CAProfileResponse, "services": CAServiceDetailsResponse | null, "booking": CABookingDetailsResponse | null }`  
  (Full CA profile + service + booking details; some may be null if not yet filled.)

- **PUT /ca/profile/visibility** — CA.  
  **Body:** `{ "is_visible": boolean }`  
  **Response (200):** CAProfileResponse (with updated `is_visible`).

- **PUT /ca/profile/services** — CA.  
  **Body:** Same as onboarding services.  
  **Response (200):** CAServiceDetailsResponse.

- **PUT /ca/profile/booking** — CA.  
  **Body:** Same as onboarding booking.  
  **Response (200):** CABookingDetailsResponse.

- **GET /ca/profile/public/{ca_id}** — No auth.  
  **Response (200):**  
  `{ "id", "full_name", "icai_membership_number", "year_of_qualification", "firm_name", "services", "consultation_mode", "languages", "experience_years", "fee_online", "fee_inperson", "available_days", "disclaimer" }`  
  **404:** CA not found or not visible.

---

### 5.5 Verification (ICAI status) — CA only

- **GET /verification/status** — CA.  
  **Response (200):**  
  `{ "ca_id", "verification_status": "PENDING"|"VERIFIED"|"FAILED", "last_checked_at", "failure_reason" }`  
  **404:** CA profile not found.

- **POST /verification/retry** — CA.  
  **Body:** `{ "full_name": string, "icai_membership_number": string }`  
  **Response (200):** Same as status. Re-submits verification (e.g. after FAILED).

- **GET /verification/log** — CA.  
  **Query:** `page` (default 1), `size` (default 20, max 100).  
  **Response (200):** Array of:  
  `{ "id", "attempt_number", "status", "icai_number_queried", "submitted_name", "extracted_name", "match_score", "failure_reason", "checked_at" }`

---

### 5.6 Search (public)

- **GET /search/ca** — No auth.  
  **Query params:**  
  `service`, `location`, `mode` (ONLINE|IN_PERSON|BOTH), `language`, `fee_min`, `fee_max`, `experience_min`, `experience_max`, `sort_by` (fee_asc|fee_desc, default fee_asc), `page` (1), `size` (1–100, default 20).  
  **Response (200):**  
  `{ "items": CASearchResult[], "total", "page", "size", "pages" }`  
  Each item: `{ "id", "full_name", "icai_membership_number", "year_of_qualification", "firm_name", "services", "consultation_mode", "languages", "experience_years", "fee_online", "fee_inperson", "available_days", "disclaimer" }`  
  Only verified, active, visible CAs are returned.

---

### 5.7 Bookings

- **POST /bookings/lock-slot** — **USER** only (403 if CA).  
  **Body:**  
  `{ "ca_id", "service", "consultation_mode", "booking_date": "ISO datetime", "slot_start", "slot_end" }`  
  **Response (200):**  
  `{ "booking_id", "slot_locked_until" (ISO datetime), "fee_ca", "platform_fee", "gst_amount", "total_amount" }`  
  **Note:** Slot is locked for a short TTL (e.g. 10 min); user must complete payment before expiry.  
  **Example body:**  
  `{ "ca_id": "<uuid>", "service": "Tax Filing", "consultation_mode": "ONLINE", "booking_date": "2025-03-01T00:00:00Z", "slot_start": "10:00", "slot_end": "10:30" }`  
  Use the CA’s `id` from search; `consultation_mode` must match one of their modes (ONLINE, IN_PERSON, BOTH). Time slots in "HH:MM" 24h.

- **GET /bookings/user** — USER only.  
  **Query:** `page`, `size`.  
  **Response (200):**  
  `{ "items": BookingResponse[], "total", "page", "size" }`

- **GET /bookings/ca** — CA only.  
  **Query:** `page`, `size`.  
  **Response (200):** Same structure; list of CA’s bookings.

- **GET /bookings/{booking_id}** — Auth required (user must be booking owner or CA of that booking).  
  **Response (200):**  
  `{ "id", "ca_id", "user_id", "service", "consultation_mode", "booking_date", "slot_start", "slot_end", "fee_ca", "status", "meeting_join_url", "created_at" }`  
  **status:** SLOT_LOCKED | PAYMENT_PENDING | CONFIRMED | CANCELLED_BY_USER | CANCELLED_BY_CA | COMPLETED.

- **POST /bookings/{booking_id}/cancel** — Auth required.  
  **Body:** `{ "reason"?: string }`  
  **Response (200):** BookingResponse (updated).

---

### 5.8 Payments

- **POST /payments/booking/initiate/{booking_id}** — **USER** only.  
  **Response (200):**  
  `{ "payment_id", "booking_id", "gateway_data": {}, "ca_fee", "platform_fee", "gst_amount", "total_amount" }`  
  **Note:** `gateway_data` typically contains Razorpay order_id and key; frontend opens Razorpay checkout. On success, gateway may redirect or callback; then frontend or backend receives webhook. Backend also exposes a confirm endpoint (below).  
  **404:** Booking not found or not owned. **402:** Payment error.  
  **Important:** Complete payment within the slot lock TTL; otherwise the booking may expire and user must lock again.

- **POST /payments/booking/webhook** — No auth (called by gateway or frontend after payment).  
  **Body:** `{ "order_id", "payment_id", "signature" }`  
  **Response (200):**  
  `{ "message", "invoice_number", "total_amount" }`  
  Use after Razorpay success to confirm and create invoice.

- **GET /payments/invoices/{booking_id}** — Auth required (owner of booking or CA).  
  **Response (200):**  
  `{ "id", "invoice_number", "invoice_type", "ca_fee", "platform_fee", "gst_amount", "total_amount", "pdf_path", "created_at" }`  
  **404:** No invoice for that booking.

---

### 5.9 Subscriptions (CA only)

- **POST /subscriptions/initiate** — CA.  
  **Response (200):**  
  `{ "subscription_id", "gateway_data", "amount", "gst_amount", "total_amount" }`  
  Frontend opens payment UI from `gateway_data`; on success, backend webhook confirms (or a similar confirm flow).

- **POST /subscriptions/webhook** — CA (auth required).  
  **Body:** `{ "order_id", "payment_id", "signature" }`  
  **Response (200):**  
  `{ "message", "end_date", "invoice_id" }`

- **GET /subscriptions/status** — CA.  
  **Response (200):**  
  `{ "is_active", "start_date", "end_date", "days_remaining" }`

- **GET /subscriptions/invoices** — CA.  
  **Response (200):** Array of  
  `{ "id", "invoice_number", "amount", "gst_amount", "total_amount", "start_date", "end_date" }`

---

### 5.10 Notifications

- **GET /notifications** — Auth required.  
  **Query:** `page`, `size`.  
  **Response (200):**  
  `{ "items": NotificationResponse[], "total", "page", "size", "pages" }`  
  Each item: `{ "id", "notification_type", "message", "is_read", "created_at" }`

- **POST /notifications/{notification_id}/read** — Auth required.  
  **Response (200):** NotificationResponse. **404:** Not found or not owned.

- **POST /notifications/read-all** — Auth required.  
  **Response (200):** `{ "message": "N notifications marked as read" }`

---

### 5.11 Settings (CA only: bank & settlements)

- **PUT /settings/bank** — CA.  
  **Body:**  
  `{ "account_holder_name", "account_number", "ifsc_code", "bank_name"?, "upi_id"? }`  
  **Response (200):**  
  `{ "id", "account_holder_name", "account_number", "ifsc_code", "bank_name", "upi_id" }`  
  **404:** CA profile not found (must complete onboarding first).

- **GET /settings/bank** — CA.  
  **Response (200):** Same. **404:** No bank details yet.

- **GET /settings/settlements** — CA.  
  **Query:** `page`, `size`.  
  **Response (200):** Array of  
  `{ "id", "booking_id", "ca_amount", "platform_amount", "is_settled", "created_at" }`

- **GET /settings/settlements/download** — CA.  
  **Response (200):** CSV file (Content-Disposition: attachment; filename=settlements.csv).  
  Frontend: trigger download (e.g. open in new tab or fetch with blob and download link).

---

## 6. Enums and constants (for TypeScript/types)

```ts
// Auth
type UserRole = "CA" | "USER";

// CA
type VerificationStatus = "PENDING" | "VERIFIED" | "FAILED";
type ConsultationMode = "ONLINE" | "IN_PERSON" | "BOTH";

// Bookings
type BookingStatus =
  | "SLOT_LOCKED"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_CA"
  | "COMPLETED";

// Payments (if needed on frontend)
type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
```

---

## 7. User flows (step-by-step)

### 7.1 New client (USER)

1. Land on marketing/home or search.
2. **Login:** Google OAuth with role **USER** → receive user + tokens. If terms not accepted, show terms (GET /terms/USER, then POST /terms/accept with current version).
3. **Profile:** GET /users/me; optionally PUT /users/me (full name). Optionally add phone: send OTP, then verify (POST verify-otp).
4. **Search:** GET /search/ca (with filters). Click a CA → GET /ca/profile/public/{ca_id}.
5. **Book:** Choose service, date, slot. POST /bookings/lock-slot → show fee breakdown and “Pay” (slot locked for limited time). POST /payments/booking/initiate/{booking_id} → open Razorpay (or gateway) with gateway_data → on success call POST /payments/booking/webhook with order_id, payment_id, signature (or let backend webhook handle it; confirm with backend if needed).
6. **My bookings:** GET /bookings/user. Click booking → GET /bookings/{id} (show meeting_join_url when CONFIRMED). Optionally GET /payments/invoices/{booking_id} and download/show invoice.
7. **Notifications:** GET /notifications; mark read / read-all as needed.

### 7.2 New CA

1. **Login:** Google OAuth with role **CA** → user + tokens. Accept terms (GET /terms/CA, POST /terms/accept).
2. **Onboarding (3 steps):**  
   - Page 1: POST /ca/onboarding/verification (name, ICAI membership number, optional COP, year, firm, address). Show “Verification pending” and optionally poll GET /verification/status.  
   - Page 2: POST /ca/onboarding/services (services, consultation_mode, languages, experience_years).  
   - Page 3: POST /ca/onboarding/booking (slot_duration_minutes, available_days, time_slots, fee_online, fee_inperson).
3. **Verification:** GET /verification/status. If FAILED, show failure_reason and allow POST /verification/retry. If VERIFIED, allow going live (toggle visibility).
4. **Profile:** GET /ca/profile. Edit services/booking via PUT /ca/profile/services and PUT /ca/profile/booking. Toggle visibility: PUT /ca/profile/visibility.
5. **Subscription:** GET /subscriptions/status. If not active, show “Subscribe” → POST /subscriptions/initiate → open payment UI → after payment, POST /subscriptions/webhook (or backend receives it). Only subscribed CAs can be visible/booking.
6. **Bank & settlements:** PUT /settings/bank (required for payouts). GET /settings/settlements; GET /settings/settlements/download for CSV.
7. **Bookings:** GET /bookings/ca. View/cancel as needed. When CONFIRMED, meeting_join_url is available for the CA to share or use.
8. **Notifications:** Same as USER.

---

## 8. Page/screen list and API mapping

| Page / screen | Who | Main APIs |
|---------------|-----|-----------|
| Login (Google / Phone) | All | POST /auth/google or send-otp + verify-otp |
| Role selection | New user | Part of Google payload (role) |
| Terms | All | GET /terms/{role}, GET /terms/status, POST /terms/accept |
| User profile | USER/CA | GET /users/me, PUT /users/me |
| Phone verify | Logged-in | POST send-otp, POST verify-otp |
| CA onboarding 1 (verification) | CA | POST /ca/onboarding/verification |
| CA onboarding 2 (services) | CA | POST /ca/onboarding/services |
| CA onboarding 3 (booking) | CA | POST /ca/onboarding/booking |
| CA dashboard / profile | CA | GET /ca/profile, PUT visibility, PUT services, PUT booking |
| Verification status / retry | CA | GET /verification/status, POST /verification/retry, GET /verification/log |
| Search CAs | Public / USER | GET /search/ca |
| Public CA profile | Public | GET /ca/profile/public/{ca_id} |
| Book slot (lock + pay) | USER | POST /bookings/lock-slot, POST /payments/booking/initiate/{id}, gateway UI, POST webhook |
| My bookings | USER | GET /bookings/user, GET /bookings/{id}, POST cancel |
| CA bookings list | CA | GET /bookings/ca, GET /bookings/{id}, POST cancel |
| Invoice (booking) | USER/CA | GET /payments/invoices/{booking_id} |
| Subscription (initiate + status) | CA | POST /subscriptions/initiate, GET /subscriptions/status, POST webhook, GET /subscriptions/invoices |
| Notifications | All | GET /notifications, POST read, POST read-all |
| Settings (bank, settlements) | CA | PUT/GET /settings/bank, GET /settings/settlements, GET /settings/settlements/download |

---

## 9. Payment gateway (Razorpay) integration notes

- Backend returns `gateway_data` from **POST /payments/booking/initiate/{booking_id}** and **POST /subscriptions/initiate**.
- Typically includes: `order_id`, `key` (Razorpay key id), and optionally `amount`, `currency`, `name`, etc. Load Razorpay script, create order with order_id, open checkout; on success you get `razorpay_payment_id` and `razorpay_signature`. Backend expects `order_id`, `payment_id`, `signature` for confirmation.
- **Booking payment:** Frontend can call POST /payments/booking/webhook with these three after successful checkout (or rely on server-side webhook if configured).
- **Subscription:** Same idea with POST /subscriptions/webhook.
- **Environment:** Frontend needs the Razorpay key id (public key) for checkout; it may be in gateway_data or a separate env (e.g. `NEXT_PUBLIC_RAZORPAY_KEY_ID`). Never expose the secret.

---

## 10. File download

- **Settlements CSV:** GET /settings/settlements/download with auth (CA). Response is CSV; use `Content-Disposition` to get filename or default to `settlements.csv`. Fetch with credentials, create blob, trigger download.

---

## 11. Environment variables (frontend)

Suggest a `.env.local` (or similar) for the frontend:

- `NEXT_PUBLIC_API_BASE_URL` or `VITE_API_BASE_URL` = `http://localhost:8001`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (or equivalent) for Google Sign-In
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` if you use it for checkout (or take from gateway_data)

Backend CORS must include your frontend origin (e.g. `http://localhost:3000`).

---

## 12. Summary checklist for the frontend agent

- [ ] Set up project (React/Next + TypeScript, routing, state, HTTP client with Bearer token and 401 refresh).
- [ ] Implement auth: Google OAuth (id_token + role), optional phone OTP, store tokens, refresh on 401, logout.
- [ ] Role-based routing: redirect CA to CA flows, USER to client flows; guard routes by role.
- [ ] Terms: fetch by role, show content, accept with version, block app until accepted if required.
- [ ] User profile: GET/PUT /users/me; optional phone verify.
- [ ] CA onboarding: 3 steps (verification, services, booking) with correct request bodies and validation.
- [ ] CA profile: full profile, edit services/booking, toggle visibility; public profile page by ca_id.
- [ ] Verification: status, retry, log (CA only).
- [ ] Search: filters and pagination; public CA profile link.
- [ ] Bookings: lock-slot (USER), list user/ca, get one, cancel; show status and meeting_join_url.
- [ ] Payments: initiate booking payment, open Razorpay (or gateway), confirm via webhook/confirm endpoint; show invoice.
- [ ] Subscriptions: initiate, status, invoices (CA); payment UI and webhook/confirm.
- [ ] Notifications: list, mark read, read-all.
- [ ] Settings: bank (CA), settlements list + CSV download (CA).
- [ ] Global error handling: parse `error.code` and `error.message`; show user-friendly messages.
- [ ] Use enums and types from Section 6 for type safety.

This spec, together with the live API at `/docs`, is sufficient for another agent or developer to build the full frontend for the CA Marketplace.

---

## 13. Optional: OpenAPI and codegen

The backend exposes OpenAPI JSON at **GET /openapi.json** (when docs are enabled). You can use this with code generators (e.g. openapi-typescript, or client generators) to get TypeScript types and API client stubs. Always align with the request/response shapes and auth described in this document.
