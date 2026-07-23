# Staging deployment runbook (Phase 0)

SkillVentures staging targets from the project plan (§4 / §13):

| Layer | Host |
|-------|------|
| Frontend | Vercel |
| Backend | Railway |
| Database | MongoDB Atlas |
| Cache | Redis (Railway Redis or Upstash) |

## Prerequisites

1. GitHub repo pushed (this monorepo).
2. Vercel account linked to the repo.
3. Railway account linked to the repo.
4. MongoDB Atlas cluster + connection string.
5. Redis instance URL.

CLI tools (optional):

```bash
npm i -g vercel @railway/cli
vercel login
railway login
```

## Backend → Railway

1. New project → Deploy from GitHub → select this repo.
2. Set **Root Directory** to `/` and use Dockerfile at `apps/server/Dockerfile`,
   **or** Nixpacks with build/start from `apps/server/railway.json`.
3. Add variables (copy from `apps/server/.env.example`):

```
NODE_ENV=staging
PORT=4000
MONGODB_URI=<atlas-uri>
REDIS_URL=<redis-url>
JWT_ACCESS_SECRET=<random-32+-chars>
JWT_REFRESH_SECRET=<random-32+-chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_COST=12
CLIENT_URL=https://<vercel-app>.vercel.app
COOKIE_SECURE=true
```

4. Health check path: `/health`
5. Confirm: `curl https://<railway-host>/health`

## Frontend → Vercel

1. Import repo → Framework Vite → **Root Directory** `apps/client`.
2. Build command:

```
cd ../.. && npm ci && npm run build -w @skillventures/shared-types && npm run build -w @skillventures/client
```

3. Output directory: `dist`
4. Env:

```
VITE_API_URL=https://<railway-host>
```

5. Confirm: open the Vercel URL → register student → dashboard.

## Local Docker (dev)

```bash
export DOCKER_HOST=unix:///var/run/docker.sock   # if Desktop socket fails
docker compose up -d
```

- Redis: `localhost:6379`
- Mongo (compose): `localhost:27019` (avoids host `:27017` conflicts)

If you already have Mongo on `:27017`, point `MONGODB_URI` at that instance instead.

## Phase 0 gate

Do **not** start Phase 1 until:

- [ ] `/health` returns ok on staging API
- [ ] Student + institution register/login work against staging
- [ ] Refresh cookie rotation works cross-origin (Vercel ↔ Railway) with `CLIENT_URL` + CORS
- [ ] CI green on `main`
