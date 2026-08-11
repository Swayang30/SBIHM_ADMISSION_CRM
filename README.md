# AuraCRM | Enterprise College Admission CRM

AuraCRM is a production-ready, modular, and high-performance College Admission CRM designed for educational institutions to manage campuses, academic departments, courses, leads routing (Round-Robin), follow-ups, documents verification, and marketing campaign attribution ROI.

---

## Technical Architecture Stack

* **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide icons, and Recharts.
* **Backend**: NestJS, RESTful API structure, JWT Authentication with role-based access control (RBAC), and Swagger documentation.
* **Database**: PostgreSQL with Prisma ORM.
* **Cache & Queues**: Redis (for background jobs, rate limits, and scheduling pointers).
* **Containerization**: Docker & Docker Compose.

---

## Directory Workspace Layout

```
college-admission-crm/
├── backend/
│   ├── src/                 # Auth modules, Leads, Assignments, Communications, Reports, Audit Logs
│   ├── prisma/              # Schema and seeders
│   └── tsconfig.json
├── frontend/
│   ├── src/app/             # Next.js pages & CSS stylesheets
│   ├── src/lib/             # API helpers & fallbacks
│   └── package.json
├── docker-compose.yml       # Production stack
├── college_crm_postman_collection.json # Testing Suite
└── README.md
```

---

## Relational Database Schema Design

AuraCRM maps out relations across these primary structures:
1. **Academic hierarchy**: `Campus` ➔ `Faculty` ➔ `Department` ➔ `Course`.
2. **Assignments & Staff**: `User` (assigned specific `Role`: `SUPER_ADMIN`, `COLLEGE_ADMIN`, `ADMISSION_MANAGER`, `COUNSELLOR`, `MARKETING_TEAM`).
3. **Leads Core**: `Lead` records details, campus/course intent, UTM params, lead temperature status, SLA records.
4. **Communications**: `WhatsAppMessage` logs inbound/outbound official templates and webhook payloads.
5. **Timeline logging**: `LeadActivity` logs any status adjustments, call dispositions, and counselor remarks.
6. **Audit tracking**: `AuditLog` records login/export actions with IP and client details.

---

## Core Algorithmic Systems

### 1. Lead Temperature Scoring Engine
Calculates lead temperatures (`COLD`, `WARM`, `HOT`) dynamically based on activities:
* **HOT**: Payment record status is `SUCCESS`, stage is `ADMISSION_CONFIRMED`, or user uploaded >= 2 verified documents.
* **WARM**: Stage is `INTERESTED` or `COUNSELLING_SCHEDULED`, has an active scheduled follow-up reminder, or communication count >= 3.
* **COLD**: Default state if no counselor response is logged within 48 hours.

### 2. Auto Round-Robin Assignment Engine
Stateful cyclical assignment routing:
1. Filter counselors matching the lead's campus/department.
2. Order counselors by the `assignedAt` date of their latest assigned lead (putting counselors who have no leads first).
3. Route the incoming lead to the counselor at index `0` and update the allocation timestamp.

### 3. SLA Breach Detector
* Default response SLA: First callback or response action must take place within **15 minutes** of lead capture.
* An automatic job checks deadlines against `lastRespondedAt` and triggers `SLAStatus.BREACHED` flags, writing alert updates to the lead activity logs.

---

## Local Setup Instructions

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL Database
* Redis Server (optional for local running, defaults to direct DB queries)

### 1. Backend Setup
1. Open a terminal in `backend/`
2. Create `.env` file:
   ```env
   DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/college_crm?schema=public"
   JWT_SECRET="supersecretkey"
   PORT=5000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations & seed data:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Launch development server:
   ```bash
   npm run start:dev
   ```
   * REST endpoints run on: `http://localhost:5000`
   * Swagger documentation is available at: `http://localhost:5000/api/docs`

### 2. Frontend Setup
1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development client:
   ```bash
   npm run dev
   ```
   * Next.js web application runs on: `http://localhost:3000`
   * *Note: The frontend includes a fallback mock layer. If the NestJS API is offline, it will run using mock datasets out-of-the-box.*

---

## Docker Stack Deployment

To launch the full production-ready stack (Next.js, NestJS, PostgreSQL, and Redis) in containers:

1. In the root directory, run:
   ```bash
   docker-compose up --build -d
   ```
2. The containers will initialize. The backend handles automatic database connections and starts listening.
3. Access the web app at `http://localhost:3000` and Swagger docs at `http://localhost:5000/api/docs`.

---

## Security Practices Matrix

1. **Role-Based Access Control (RBAC)**: All endpoints are protected by JwtAuthGuard and RolesGuard checks.
2. **Audit Logging**: All write/export actions are audited with metadata:
   * Action Type (LOGIN, UPDATE_LEAD, EXPORT)
   * User reference
   * Client IP & User Agent string
3. **Data Sanitization**: Built-in validation pipes (`class-validator`) protect against payload injection. Database interactions are parameterized using Prisma to eliminate SQL Injection risks.
4. **SLA Alerts**: The system enforces automatic response times to maintain institutional conversion rates.
