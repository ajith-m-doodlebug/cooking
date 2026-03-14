# CA Marketplace

Two-sided marketplace where Chartered Accountants list services and clients find and book consultations.

## Project layout

| Path | Contents |
|------|----------|
| **`/backend`** | FastAPI app, Alembic, Celery, tests, `Dockerfile`, `requirements.txt` |
| **`/frontend`** | Frontend application (add your UI here) |
| **`/docs`** | Documentation and specs |
| **Root** | Scripts (`setup.sh`, `start.sh`, `stop.sh`), `docker-compose.yml`, `.env`, `.env.example` |

## Quick Start

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Run setup (build images, start db/redis, run migrations)
./setup.sh

# 3. Start all services (or: docker compose -p cooking up -d)
./start.sh

# 4. API is available at
http://localhost:8001

# 5. Interactive API docs (development only)
http://localhost:8001/docs
```

## Architecture

### Provider Abstraction (Plug & Play)

All third-party integrations are swappable by changing a single `.env` variable:

| Provider | Env Var | Current |
|---|---|---|
| Payment | `PAYMENT_PROVIDER` | `razorpay` |
| OTP/SMS | `OTP_PROVIDER` | `twilio` |
| Meetings | `MEETING_PROVIDER` | `google_meet` |

To switch — e.g. to Stripe — add `backend/app/providers/payment/stripe.py` implementing `PaymentProvider` ABC, then set `PAYMENT_PROVIDER=stripe`. Nothing else changes.

### Automated CA Verification

When a CA submits their ICAI membership number, a Celery background job automatically verifies it against the ICAI List of Members portal (`http://112.133.194.254/lom.asp`). No admin action required.

- Match score ≥ 85 (fuzzy) → `VERIFIED`
- No record / mismatch → `FAILED` (CA can retry)
- Network errors → retried up to 3 times with exponential backoff

### Module Structure (backend)

```
backend/app/
├── core/            — JWT, exceptions, utilities
├── providers/       — payment / OTP / meeting abstractions
└── modules/
    ├── auth/        — Google OAuth, phone OTP, JWT
    ├── terms/       — T&C versioning + acceptance
    ├── users/       — Client profile
    ├── ca/          — CA onboarding (3 pages), profile, visibility
    ├── verification/— ICAI LOM scraper + verification lifecycle
    ├── search/      — Filtered/sorted CA search
    ├── bookings/    — Slot locking (Redis), booking lifecycle
    ├── payments/    — User payments, invoices, settlements
    ├── subscriptions— CA subscription, auto-disable
    ├── notifications— In-app notifications
    └── settings/    — Bank details, settlement reports
```

## Docker Services

| Service | Purpose |
|---|---|
| `api` | FastAPI app (host port 8001) |
| `worker` | Celery worker (verification, notifications) |
| `beat` | Celery scheduler (subscription expiry checks daily) |
| `db` | PostgreSQL 16 (host port 5433) |
| `redis` | Redis 7 — broker, OTP cache, slot locks (host port 6380) |
| `adminer` | DB admin UI (host port 8081) |

### Adminer login

Open **http://localhost:8081** and use:

| Field | Value |
|-------|--------|
| **System** | **PostgreSQL** (change from MySQL if needed) |
| **Server** | `db` |
| **Username** | `postgres` |
| **Password** | `postgres` |
| **Database** | `ca_marketplace` (optional; leave empty to pick after login) |

Adminer runs inside Docker, so the database host is the service name `db`, not `localhost`.

## Database Migrations

```bash
# Run migrations (./setup.sh does this, or run manually)
docker compose -p cooking run --rm api alembic upgrade head

# Create a new migration after model changes
docker compose -p cooking run --rm api alembic revision --autogenerate -m "description"
```

## Environment Variables

See `.env.example` for the full list. Key variables:

- `SECRET_KEY` — JWT signing secret (change in production)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth app credentials
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay API keys
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` — Twilio OTP/SMS credentials
- `GOOGLE_MEET_*` — Google Calendar API credentials for Meet integration
# cooking
