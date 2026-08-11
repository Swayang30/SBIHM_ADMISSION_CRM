# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AuraCRM — a College Admission CRM. Two independent apps in one repo:

- `backend/` — NestJS 10 REST API + Prisma 5 + PostgreSQL (JWT auth, RBAC, Swagger)
- `frontend/` — Next.js 15 (App Router) + React 19 + Tailwind + Recharts dashboard

GitHub: https://github.com/Swayang30/SBIHM_ADMISSION_CRM (frontend deploys to Vercel with Root Directory = `frontend`; the backend cannot run on Vercel and needs a server host).

## Commands

### Backend (`backend/`)
```bash
npm run start:dev        # dev server with watch → http://localhost:5000, Swagger at /api/docs
npm run build            # nest build → dist/
npm test                 # jest (tests are src/**/*.spec.ts)
npx jest leads.service   # run a single test file by name pattern
npx prisma migrate dev   # apply/create migrations
npx prisma db seed       # seed demo data (runs prisma/seed.ts)
npx prisma generate      # regenerate client after schema.prisma changes
```

Requires `backend/.env` (gitignored, must be created manually):
```env
DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/college_crm?schema=public"
JWT_SECRET="supersecretkey"
PORT=5000
```

### Frontend (`frontend/`)
```bash
npm run dev    # → http://localhost:3000
npm run build
npm run lint
```

Optional `frontend/.env` (gitignored): `NEXT_PUBLIC_API_URL="http://localhost:5000"`.

The frontend runs fine **without the backend or a database** — see the mock fallback layer below.

## Architecture

### Frontend: one giant component + hybrid API layer

- The **entire UI lives in `frontend/src/app/page.tsx`** (~2,500 lines, `'use client'`): login screen, role-specific dashboards, lead kanban/pipeline, lead detail, marketing attribution, settings. Navigation is `useState('activeTab')`-based — there are no other routes or pages. Any UI change happens in this file.
- `frontend/src/lib/api.ts` is the only API layer. `fetchFromAPI()` tries the real backend (`NEXT_PUBLIC_API_URL`, default `http://localhost:5000`); **on any fetch failure it silently returns mock data** matched by endpoint prefix (`/auth/login`, `/leads`, `/reports/*`). This means the app never visibly errors when the backend is down — check the browser console (`API unavailable, fallback mock triggered`) to know which mode you're in. Mock login accepts any password.

### Backend: NestJS modules, business logic concentrated in LeadsService

Modules (`backend/src/`): `auth`, `campus`, `leads`, `communications` (WhatsApp logs), `reports` (role-specific dashboards), `audit-logs`, plus a global `PrismaModule`.

- **Auth/RBAC**: `JwtAuthGuard` + `RolesGuard` with the `@Roles(...)` decorator; roles are `SUPER_ADMIN`, `COLLEGE_ADMIN`, `ADMISSION_MANAGER`, `COUNSELLOR`, `MARKETING_TEAM`. Passwords hashed with bcryptjs.
- **`leads/leads.service.ts` holds the core domain logic** — read it before touching anything lead-related:
  - *Duplicate detection*: a new lead matching an existing phone or email gets status `DUPLICATE` and is not assigned.
  - *Round-robin assignment*: picks active counsellors (filtered by campus), ordered by the `assignedAt` of their most recent lead (counsellors with no leads first), assigns to index 0.
  - *SLA*: `slaDeadline` = creation time + 15 minutes; breaches flip `slaStatus` to `BREACHED`.
  - *Temperature engine* (`evaluateLeadTemperature`): recalculates COLD/WARM/HOT from payments, stage, documents, follow-ups, and communication counts (rules documented in README.md).
  - Every mutation also writes a `LeadActivity` timeline entry.
- `main.ts`: global `ValidationPipe` (`whitelist`, `transform`), open CORS, Swagger at `/api/docs`.

### Data model (`backend/prisma/schema.prisma`)

Academic hierarchy `Campus → Faculty → Department → Course`. `Lead` is the central entity: contact/academic-intent fields, full UTM/ad attribution (`utmSource…utmTerm`, `gclid`, `fbclid`, `leadCost`), pipeline `status` (15-value enum), `temperature`, SLA fields, and counsellor assignment. Satellite tables all cascade-delete from Lead: `LeadActivity`, `FollowUp`, `Document`, `WhatsAppMessage`, `Payment`. `AuditLog` records user actions with IP/user-agent.

Several fields are stringly-typed by convention rather than enums (e.g. `LeadActivity.actionType`, `Payment.status`, `WhatsAppMessage.direction`) — match existing string values when writing to them.

### Seed data (`backend/prisma/seed.ts`)

**Deletes all rows first**, then creates 2 campuses, courses, and users — all with password `Password123`: `admin@college.edu` (SUPER_ADMIN), `main-admin@college.edu`, `marketing@college.edu`, `sarah@college.edu` and `john@college.edu` (COUNSELLOR). The frontend mock layer mirrors these same emails/roles.

## Gotchas

- Never commit `node_modules/`, `dist/`, `.next/`, or `.env` files (all gitignored; `.env` files hold secrets and each dev/host recreates them).
- `docker-compose.yml` runs the full stack (frontend, backend, PostgreSQL, Redis) but requires Docker.
- `college_crm_postman_collection.json` at the repo root is the API test suite for manual endpoint testing.
