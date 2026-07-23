# SkillVentures

Production MERN monorepo for courses, bootcamps, and hackathon discovery.

## Structure

```
apps/client          React + Vite + TypeScript
apps/server          Express + MongoDB + Redis
packages/shared-types  Shared TS contracts
```

## Prerequisites

- Node.js 20+
- Docker (MongoDB + Redis via `docker-compose`)

## Local setup

```bash
# Start Mongo + Redis
# Mongo is published on :27019 to avoid conflicts with a local Mongo on :27017
docker compose up -d

# Install deps
npm install

# Server env
cp apps/server/.env.example apps/server/.env
# If using compose Mongo: set MONGODB_URI=mongodb://127.0.0.1:27019/skillventures
# If using host Mongo on :27017: leave the example URI as-is

# Build shared types
npm run build -w @skillventures/shared-types

# Run API + client
npm run dev:server
npm run dev:client
```

- API: http://localhost:4000/health
- Client: http://localhost:5173

## Auth endpoints (Phase 0)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/auth/register/student` | Zod-validated |
| POST | `/api/v1/auth/register/institution` | Creates user + pending institution |
| POST | `/api/v1/auth/login` | Access JWT + HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | Refresh rotation (reuse detection) |
| POST | `/api/v1/auth/logout` | Revokes refresh token |
| POST | `/api/v1/auth/google` | Stub until `GOOGLE_CLIENT_ID` is set |
| GET | `/api/v1/auth/me` | Bearer access token required |

## Tests

```bash
npm run test -w @skillventures/server
npm run test -w @skillventures/client
```

## Staging deploy

### Backend (Railway)

1. Create a Railway project from this repo.
2. Set root / Dockerfile to `apps/server/Dockerfile` (or use `apps/server/railway.json`).
3. Provision MongoDB Atlas + Redis (Upstash or Railway Redis).
4. Set env vars from `apps/server/.env.example` (use strong JWT secrets, `COOKIE_SECURE=true`, `CLIENT_URL` = Vercel URL).
5. Health check: `GET /health`.

### Frontend (Vercel)

1. Import repo into Vercel.
2. Root directory: `apps/client`.
3. Build command: `cd ../.. && npm ci && npm run build -w @skillventures/shared-types && npm run build -w @skillventures/client`
4. Output: `apps/client/dist`
5. Env: `VITE_API_URL=https://<your-railway-api-host>`

## Phase status

**Phase 0:** monorepo, auth, models, CI.

**Phase 1:** listings, search, enquiries, institution + admin dashboards.

**Phase 2:** reviews (verified-applicant gated), Razorpay subscriptions + featured boosts,
institution analytics (Standard/Premium).

**Phase 3:** bootcamp/hackathon fields, bookmarks, application tracker, compare tool,
SEO (sitemap + JSON-LD + SSR HTML), push token registration stub.

**Phase 4:** marketplace UI polish (Coursera/Udemy-level shell), Redis cache on public listing
feeds, featured expiry job, lean listing queries, GA4 analytics stub, k6 load script,
Playwright E2E skeleton, security audit checklist (`docs/SECURITY_AUDIT.md`).

### Phase 2 notes

- Reviews require enquiry status `converted` before submit (§6 integrity rule).
- Webhooks verify `x-razorpay-signature` before crediting (§11).
- Without Razorpay keys, orders are mock (`order_test_*`) and confirmable via
  `POST /api/v1/subscriptions/confirm-mock` (non-production only).
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` for live Checkout.

### Phase 4 commands

```bash
# Unit / API tests
npm run test -w @skillventures/server
npm run test -w @skillventures/client

# Playwright E2E (API must be on :4000; client starts via config)
npm run test:e2e:install -w @skillventures/client
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -w @skillventures/client   # if client already running

# Load test (install k6 separately)
k6 run -e BASE_URL=http://localhost:4000 scripts/load-test/listings-search.js
```

Set `VITE_GA4_MEASUREMENT_ID` on the client for GA4; without it, events log to the console in dev.

### Demo data (mock listings + covers)

```bash
# Downloads Unsplash free-stock covers into apps/client/public/images/listings/
npm run fetch:mock-images -w @skillventures/server

# Seeds 10 published programs + 2 demo institutions
npm run seed:mock -w @skillventures/server
```

Demo institution logins: `demo.institute@skillventures.local` / `DemoPass123`

### Admin & student demo accounts

```bash
npm run seed:admin -w @skillventures/server
npm run seed:super-admin -w @skillventures/server
npm run seed:student -w @skillventures/server
```

| Role | Email | Password |
|---|---|---|
| Student | `demo.student@skillventures.local` | `DemoPass123` |
| Admin | `admin@skillventures.local` | `AdminPass123` |
| Super Admin | `superadmin@skillventures.local` | `SuperAdminPass123` |

Super admin pages: `/admin/admins`, `/admin/audit`, `/admin/settings` (regular admins see shared moderation routes only).

> Cover images are **Unsplash CDN downloads** (free stock), not scraped from Coursera/Udemy.
