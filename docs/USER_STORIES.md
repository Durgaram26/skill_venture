# SkillVentures — User Stories & Roles

> Living document for product scope, RBAC, and demo accounts.  
> Source of truth for roles: `skillventures_project_plan.md` §2.

---

## 1. Role overview

| Role | Who | Primary goal |
|---|---|---|
| **Guest** | Unauthenticated visitor | Discover programs without signing up |
| **Student** | Registered learner | Find, compare, enquire, bookmark, review |
| **Institution** | Training partner (verified or pending) | Publish programs and manage leads |
| **Admin** | Platform moderator | Verify partners, moderate listings/reviews, manage users |
| **Super Admin** | Platform owner / ops lead | Everything Admin can do **plus** admin management, system config, financial reports |

**Enforcement:** JWT + server-side `authorize()` on every protected route. Client role checks are UX only.

---

## 2. Demo & seed accounts (local)

Run seeds before using these logins (Mongo + Redis must be up via `docker compose up -d`):

```bash
npm run seed:admin -w @skillventures/server
npm run seed:super-admin -w @skillventures/server
npm run seed:student -w @skillventures/server
npm run seed:mock -w @skillventures/server   # optional: listings + institution demos
```

| Role | Email | Password | How created | Notes |
|---|---|---|---|---|
| **Student** | `demo.student@skillventures.local` | `DemoPass123` | `npm run seed:student` | Priya Sharma — enquire, pay, bookmarks |
| **Admin** | `admin@skillventures.local` | `AdminPass123` | `npm run seed:admin` | Full admin panel access |
| **Super Admin** | `superadmin@skillventures.local` | `SuperAdminPass123` | `npm run seed:super-admin` | Owner pages + financial |
| **Institution** | `demo.institute@skillventures.local` | `DemoPass123` | `npm run seed:mock` | Nimbus Skill Labs |
| **Institution** | `demo.campus@skillventures.local` | `DemoPass123` | `npm run seed:mock` | Horizon Campus Academy |

Override student credentials via env when seeding:

```bash
STUDENT_EMAIL=you@example.com STUDENT_PASSWORD=YourPass123 npm run seed:student -w @skillventures/server
```

Override admin credentials via env when seeding:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourPass123 npm run seed:admin -w @skillventures/server
```

---

## 3. Guest (unauthenticated)

| ID | Story | Acceptance criteria | Status |
|---|---|---|---|
| G-01 | As a guest, I want to browse and search programs so I can explore without creating an account. | `/listings` works without login; filters update results. | ✅ Done |
| G-02 | As a guest, I want to view program and institution detail pages so I can evaluate options. | Public listing + institution pages load. | ✅ Done |
| G-03 | As a guest, I want to compare 2–3 programs so I can decide before signing up. | Compare tray + `/compare` table. | ✅ Done |
| G-04 | As a guest, I want a clear path to register or log in when I enquire or bookmark. | Auth CTAs on protected actions. | ✅ Done |

---

## 4. Student

| ID | Story | Acceptance criteria | Status |
|---|---|---|---|
| S-01 | As a student, I want to register and log in so I can save my progress. | `/register`, `/login`, JWT + refresh cookie. | ✅ Done |
| S-02 | As a student, I want to bookmark programs so I can return later. | `/student/bookmarks`. | ✅ Done |
| S-03 | As a student, I want to submit enquiries so institutions can contact me. | Enquiry flow on listing detail. | ✅ Done |
| S-04 | As a student, I want to track my enquiries so I know what stage each lead is in. | `/student/enquiries`. | ✅ Done |
| S-05 | As a student, I want to write reviews after a verified application so reviews stay trustworthy. | Review API with verified-applicant rule. | ✅ Partial |
| S-06 | As a student, I want email/in-app notifications when enquiry status changes. | Transactional email + push. | ⏳ Planned |
| S-07 | As a student, I want “near me” and richer filters (price, rating, duration). | Extended filter API + UI. | ⏳ Partial |

---

## 5. Institution

| ID | Story | Acceptance criteria | Status |
|---|---|---|---|
| I-01 | As an institution, I want to register and submit my profile for verification. | Register with `role=institution`; pending verification state. | ✅ Done |
| I-02 | As a verified institution, I want to create and publish listings so students can discover us. | `/institution`, create listing, moderation queue. | ✅ Done |
| I-03 | As an institution, I want an enquiry inbox so I can move leads through a pipeline. | Dashboard enquiries + status updates. | ✅ Done |
| I-04 | As an institution, I want analytics on views and conversions. | `/institution/analytics`. | ✅ Done |
| I-05 | As an institution, I want to manage subscription and featured listing billing. | `/institution/billing`, Razorpay stub. | ✅ Partial |
| I-06 | As an institution, I want to reply publicly to reviews. | Institution reply on reviews. | ⏳ Planned |
| I-07 | As an unverified institution, I should see limited dashboard until approved. | Gated publish / verified badge. | ✅ Partial |

---

## 6. Admin

| ID | Story | Acceptance criteria | Status |
|---|---|---|---|
| A-01 | As an admin, I want an overview dashboard so I see what needs attention today. | `/admin` — queues, pulse metrics. | ✅ Done |
| A-02 | As an admin, I want to verify or reject institution partners. | `/admin/institutions`. | ✅ Done |
| A-03 | As an admin, I want to moderate listings (publish / reject / pause). | `/admin/listings`. | ✅ Done |
| A-04 | As an admin, I want to moderate flagged reviews. | `/admin/reviews`. | ✅ Done |
| A-05 | As an admin, I want to ban or unban abusive users. | `/admin/users`. | ✅ Done |
| A-06 | As an admin, I want platform and revenue analytics. | `/admin/analytics`. | ✅ Done |
| A-07 | As an admin, I want to manage homepage content and categories. | CMS for banners, SEO pages. | ✅ Done (super admin: `/admin/settings`) |
| A-08 | As an admin, I want to handle support tickets and disputes. | Ticket queue + resolution. | ✅ Done (`/admin/support`) |

**Routes:** `/admin/*` · **API:** `/api/v1/admin/*` · **Seed:** `admin@skillventures.local` / `AdminPass123`

Super-admin-only routes: `/admin/admins`, `/admin/audit`, `/admin/settings` (+ financial section on `/admin/analytics`)

---

## 7. Super Admin

### Where is Super Admin today?

| Layer | Location | Current behavior |
|---|---|---|
| **Type definition** | `packages/shared-types/src/index.ts` → `UserRole` includes `'super_admin'` | Role exists in schema |
| **Database** | `apps/server/src/models/User.ts` | `role` enum allows `super_admin` |
| **API auth** | `apps/server/src/modules/admin/admin.routes.ts` | Shared admin routes + `authorize('super_admin')` on owner-only endpoints |
| **Client UI** | `AdminShell.tsx` | Super-only tabs: Team, Audit, Settings; financial block on Analytics |
| **Seed script** | `npm run seed:super-admin -w @skillventures/server` | Creates `superadmin@skillventures.local` |
| **Super-only features** | Audit logs, admin team, platform settings, financial report | Implemented |

**Summary:** Super Admin has a seeded account, dedicated UI pages, and server-enforced routes beyond regular admin access.

### Super Admin user stories

| ID | Story | Acceptance criteria | Status |
|---|---|---|---|
| SA-01 | As a super admin, I want a seeded account for local/staging so I can test owner-level access. | `seed:super-admin` script + documented credentials. | ✅ Done |
| SA-02 | As a super admin, I want to promote/demote platform admins so I can delegate moderation. | Admin user CRUD; cannot demote last super admin. | ✅ Done (`/admin/admins`) |
| SA-03 | As a super admin, I want to view audit logs of admin actions so I can trace decisions. | Audit log UI (verify, moderate, ban events). | ✅ Done (`/admin/audit`) |
| SA-04 | As a super admin, I want financial reports (MRR, churn, paid orders) so I can run the business. | Extended analytics + export. | ✅ Done (financial section on `/admin/analytics`) |
| SA-05 | As a super admin, I want system configuration (feature flags, categories, homepage). | Settings panel; env-safe toggles. | ✅ Done (`/admin/settings`; flags gate registration) |
| SA-06 | As a super admin, I want super-only routes blocked for regular admins server-side. | `authorize('super_admin')` on SA-only endpoints. | ✅ Done |

### Demo account

| Email | Password | Role |
|---|---|---|
| `superadmin@skillventures.local` | `SuperAdminPass123` | Super Admin |

---

## 8. Cross-cutting stories

| ID | Story | Status |
|---|---|---|
| X-01 | Mobile-first responsive UI across marketplace, auth, admin | ✅ Ongoing |
| X-02 | Redis cache on hot listing reads; invalidate on mutate | ✅ Done |
| X-03 | SEO-friendly listing URLs (`/listings/:slug`) | ✅ Done |
| X-04 | Global search at scale (Atlas Search / Elasticsearch) | ⏳ Planned |
| X-05 | WCAG AA accessibility on core flows | ⏳ Partial |

---

## 9. Implementation map (quick reference)

```
Public          →  /, /listings, /listings/:slug, /compare, /institutions/:id
Student         →  /student/enquiries, /student/bookmarks, /student/payments
Institution     →  /institution, /institution/listings/new, /institution/listings/:id/edit, /institution/billing, /institution/analytics
Admin           →  /admin, /admin/institutions, /admin/listings, /admin/reviews, /admin/users, /admin/analytics, /admin/support
Super Admin     →  /admin/admins, /admin/audit, /admin/settings (+ financial on /admin/analytics)
Auth            →  /login, /register, /profile
```

---

## 10. Changelog

| Date | Change |
|---|---|
| 2026-07-17 | Initial user stories doc; documented super_admin gap and demo accounts |
| 2026-07-17 | Completed super admin: team, audit, settings, financial report, support queue |
| 2026-07-17 | Seeded demo student `demo.student@skillventures.local` / `DemoPass123` (`seed:student`) |
