# CA Marketplace Frontend

Next.js 14 (App Router) frontend for the CA Marketplace. See `docs/FRONTEND_BUILD_SPEC.md` for API and behaviour details.

## Run locally

1. From this directory:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8001), NEXT_PUBLIC_GOOGLE_CLIENT_ID, and optionally NEXT_PUBLIC_RAZORPAY_KEY_ID
   npm install
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000). The app talks to the backend at `NEXT_PUBLIC_API_BASE_URL` (browser makes requests to that URL).

## Run via Docker

From the repo root:

```bash
docker compose -p cooking up -d
```

Frontend is built and served at [http://localhost:3000](http://localhost:3000). The browser still calls the API at `http://localhost:8001`; set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001` for the frontend service (already set in `docker-compose.yml`).

For **development with hot reload** in Docker, you can override the frontend service:

- Build and run with: `docker compose -p cooking run --service-ports -v "$(pwd)/frontend:/app" -v /app/node_modules frontend npm run dev`
- Or add a `docker-compose.override.yml` that sets `command: npm run dev` and mounts `./frontend:/app` (and an anonymous volume for `node_modules`).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8001`). Use host URL so the browser can reach the API. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID for Sign-In. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | (Optional) Razorpay key for checkout; can also come from `gateway_data`. |

Copy from `.env.local.example` and fill in values.

## Stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **State:** TanStack React Query, Zustand (auth)
- **Forms:** React Hook Form, Zod, @hookform/resolvers
- **HTTP:** Axios (Bearer token, 401 refresh, redirect to login)
- **Auth:** Google OAuth (`@react-oauth/google`), role-based routing (CA → `/ca/*`, USER → `/client/*`)

## Routes (summary)

- `/` — Home
- `/login` — Google Sign-In (role: CA or USER)
- `/terms` — Accept T&C (when required)
- `/search` — Public CA search
- `/ca/public/[caId]` — Public CA profile
- `/ca/dashboard`, `/ca/onboarding`, `/ca/bookings`, `/ca/subscription`, `/ca/settings` — CA area (guarded)
- `/client`, `/client/bookings`, `/client/book` — Client area (guarded)
