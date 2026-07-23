# Security audit — Phase 4 (§11)

Checklist against `skillventures_project_plan.md` §11. Status as of Phase 4 polish.

| Control | Status | Notes |
|--------|--------|-------|
| Passwords bcrypt cost ≥ 12 | Done | Auth service uses bcrypt with cost 12 |
| JWT 15m + HttpOnly refresh 7d rotation | Done | Access + refresh cookie; reuse detection |
| Zod on every endpoint, reject unknown | Done | `.strict()` schemas + validate middleware |
| Rate limiting (IP / auth stricter) | Done | Redis-backed `express-rate-limit` |
| CORS allow-list (no `*` in prod) | Done | `CLIENT_URL` origin only |
| Helmet HTTP headers | Done | Enabled in `createApp` |
| Mongoose parameterized queries | Done | No raw `$where` |
| File uploads MIME/size/S3 | Deferred | No upload endpoints yet — add before media launch |
| Razorpay webhook signature | Done | Verified before credit |
| Admin IP / 2FA | Partial | RBAC + audit log; IP allow-list / 2FA still open |
| Admin audit log | Done | `AuditLog` on moderate / verify actions |
| Secrets in env / not in git | Done | `.env.example` only; Dependabot in CI |
| Dependency scanning | Done | Dependabot + `npm audit` in CI |

## Pre-launch hardening still recommended

1. Turn on `COOKIE_SECURE=true` and strong JWT secrets in staging/prod.
2. Add admin IP allow-list or TOTP before public launch of `/admin`.
3. When adding uploads: MIME allow-list, size cap, virus scan, object storage.
4. Run `k6` load test (`scripts/load-test/listings-search.js`) and confirm p95 under threshold with Redis warm.
5. Confirm CORS `CLIENT_URL` matches the production frontend origin exactly.
