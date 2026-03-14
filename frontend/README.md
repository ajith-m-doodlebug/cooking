# CA Marketplace Frontend

Next.js 14 (App Router) frontend for the CA Marketplace. See `docs/FRONTEND_BUILD_SPEC.md` for API and behaviour details.

## Run locally

1. From this directory:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local: set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8001) and Firebase config (see "Firebase" below); optionally NEXT_PUBLIC_RAZORPAY_KEY_ID
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
| `NEXT_PUBLIC_FIREBASE_*` | Firebase config (see **Firebase** below). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | (Optional) Razorpay key for checkout; can also come from `gateway_data`. |

Copy from `.env.local.example` and fill in values.

### Firebase

Login uses **Firebase Authentication** with the Google provider. For project [cooking-66acb](https://console.firebase.google.com/project/cooking-66acb):

1. In [Firebase Console](https://console.firebase.google.com/project/cooking-66acb/settings/general), add a **Web app** if you haven’t, then copy the config object.
2. In **Authentication → Sign-in method**, enable **Google** and set the OAuth client (or use the default).
3. In `.env.local`, set:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (e.g. `cooking-66acb.firebaseapp.com`)
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (e.g. `cooking-66acb`)
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

## Stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **State:** TanStack React Query, Zustand (auth)
- **Forms:** React Hook Form, Zod, @hookform/resolvers
- **HTTP:** Axios (Bearer token, 401 refresh, redirect to login)
- **Auth:** Firebase Authentication (Google sign-in), then `POST /auth/google` with id token + role; role-based routing (CA → `/ca/*`, USER → `/client/*`)

## Routes (summary)

- `/` — Home
- `/login` — Google Sign-In (role: CA or USER)
- `/terms` — Accept T&C (when required)
- `/search` — Public CA search
- `/ca/public/[caId]` — Public CA profile
- `/ca/dashboard`, `/ca/onboarding`, `/ca/bookings`, `/ca/subscription`, `/ca/settings` — CA area (guarded)
- `/client`, `/client/bookings`, `/client/book` — Client area (guarded)
