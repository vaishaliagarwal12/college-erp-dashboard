# College ERP — Upgradation Plan

Scope: **new capabilities and architecture upgrades** that go beyond the current implementation, turning the skeleton into a full-featured, production-ready College ERP.

> Prerequisite: complete the improvements in `improvement.md` first — security fixes, error handling, and validation are the foundation for everything below.

---

## 1. Authentication & Access Control Upgrade

### 1.1 Role-Based Access Control (RBAC)
Current state: single `Admin` model with a 3-value role enum.

**Upgrade:**
- Introduce a `User` base model with fields: `name`, `email`, `password`, `role`, `status`.
- Link `Student`, `Faculty`, `Admin` records to a `User` via `ObjectId` (`user: { type: ObjectId, ref: "User" }`).
- Add roles: `SuperAdmin`, `Admin`, `Faculty`, `Student`, plus optional `Registrar`, `Accounts`.
- Store a permission map (`{ module: string, action: 'read'|'write'|'delete' }[]`) so `authorize` becomes data-driven instead of hardcoded role checks.

### 1.2 Session & token strategy
- `accessToken` (short-lived, ~15 min) + `refreshToken` (long-lived, rotating, stored hashed server-side or httpOnly cookie).
- Refresh endpoint to obtain new access tokens; auto-logout on refresh-token reuse.
- Optional: add `express-session` if you prefer server sessions over JWTs.

### 1.3 Password & account security
- Password reset via email token flow (expiring reset link).
- Email verification on registration.
- Account lockout after N failed logins; password history/expiry.
- Optional: TOTP / 2FA for admin accounts.

### 1.4 SSO / OAuth (optional)
- Google / Microsoft Entra SSO for students & faculty via `passport` or a dedicated OAuth provider.

---

## 2. Student Module Upgrades

- **Admission/enrollment flow** — enrollment application → approval → roll number generation.
- **Student profile** — documents, photos (see File/Media section), guardian details, emergency contact, medical info.
- **Fee module** — fee structure per course/semester, invoicing, payment receipts, dues & payment history (integrate Razorpay/Stripe or track offline payments).
- **Attendance** — daily/period-wise marking, present% computation, editable with audit trail.
- **Grading & transcripts** — marks entry per course, GPA/CGPA computation, grade sheets and transcript PDF generation.

---

## 3. Academic & Faculty Module Upgrades

### 3.1 Timetable & scheduling
- Class schedule per department/year/semester; conflict detection when assigning faculty/rooms.
- Holiday calendar and working-day calculation.

### 3.2 Faculty workload
- Course allocation per semester, teaching hours, workload reports.

### 3.3 Exams
- Exam scheduler, seating plans, results entry, result publishing with role-based visibility, and re-evaluation requests.

### 3.4 Curriculum
- Course syllabus storage, outcomes mapping, credit requirement tracking per program.

---

## 4. Dashboard & Analytics Upgrade

Current: 4 static counts.

**Upgrade (multi-layer):**
- **Operational stats**: real counts, per-department breakdown, semester-wise student distribution, faculty by designation, course status.
- **Charts**: React charting (Recharts / Chart.js) for admissions over time, attendance trends, fee collections.
- **Aggregation pipeline**: replace `countDocuments` with single-pass `$facet` aggregations for performance.
- **Role-aware dashboards**: different widgets for Admin / Faculty / Student (e.g. student sees attendance, fees, grades).
- **Notifications**: announcements/broadcast to students & faculty, in-app + email.
- **Export**: CSV/Excel export of any list (students, faculty, results, fees).

---

## 5. Real-Time Features

- **WebSockets (Socket.IO)** for live notifications and attendance/announcement feeds.
- Optional **live class / video** integration (Zoom/Meet scheduling).

---

## 6. File & Media Management

- Uploads for student photos, documents, fee receipts, results PDFs.
- Use **GridFS** (already in the Mongo stack) or integrate **Cloudinary / AWS S3**.
- Signed URL generation; per-role read access; virus scanning + file-size/type restrictions.

---

## 7. API & Platform Upgrades

### 7.1 API design
- API versioning: `/api/v1/...` for the current surface; new modules under `v2`.
- OpenAPI 3.0 spec + Swagger UI for documented, testable APIs.

### 7.2 Pagination, filtering & sorting conventions
- Standardize `page`, `limit`, `sort`, `search`, `fields` query params across all list endpoints.
- Move from regex search to Mongo text indexes for scalable search.

### 7.3 Caching
- Redis for: rate-limit storage, session/refresh-token storage, dashboard stat caching, hot reads (course/department lists).

### 7.4 Performance
- Mongoose indexes on all filter/sort fields (`status`, `department`, `semester`, `rollNumber`).
- `.lean()` for read-only queries; projection to return only needed fields.
- Pagination via `limit/offset` or cursor-based for large datasets.

### 7.5 Background jobs
- A job queue (BullMQ + Redis) for: email sending, PDF generation, fee-due reminders, report generation.

### 7.6 Testing & CI/CD
- Unit + integration + e2e suites (Vitest/Jest + supertest + Playwright for the client).
- GitHub Actions: lint → test → build → deploy; auto-migration on deploy.

---

## 8. Frontend Upgrade

Current: single hardcoded dashboard page.

- **Router + guards**: react-router-dom routes with role-protected pages (`/login`, `/dashboard`, `/students`, `/faculty`, `/departments`, `/courses`, `/attendance`, `/fees`, `/results`).
- **State management**: React Query (server state) + Zustand/Context (auth/session).
- **Component library**: Material UI or shadcn/ui for consistent tables, forms, dialogs.
- **Data tables**: TanStack Table with sorting, filtering, pagination, row actions.
- **Forms**: react-hook-form + zod validation matching the backend schema.
- **Toasts & error states** with the standardized API envelope.

---

## 9. Data & Storage Upgrades

### 9.1 Migrations
- Introduce a migration tool (e.g. `migrate-mongo`) since schema will evolve (User split, ObjectId refs).

### 9.2 Backups & DR
- Atlas scheduled backups; document restore procedure in the Readme.

### 9.3 Audit logging
- `AuditLog` collection recording who did what (create/update/delete) across all modules — required for a college ERP.

### 9.4 Multi-tenancy (optional/future)
- If the product is sold to multiple colleges: tenant-scoped collections or `collegeId` field + isolation checks in every query.

---

## 10. Suggested Roadmap

| Phase | Scope |
|-------|-------|
| **P1 — Foundation** | improvements.md items, User model split, RBAC, refresh tokens, audit log |
| **P2 — Core academic** | attendance, exams/results, timetable, file uploads |
| **P3 — Finance** | fee module, receipts, export/reports |
| **P4 — Platform** | Redis, job queue, OpenAPI, CI/CD, real-time notifications |
| **P5 — Scale** | multi-tenancy, SSO, advanced analytics |

---

## Proposed Target Architecture

```
client (React 19 + Vite)
   │  /api (proxied)
server (Express 5, versioned /api/v1)
   ├─ modules/            ← feature modules (auth, students, faculty, dept, course, attendance, fees, results, timetable, files, audit)
   │    ├─ *.model.js
   │    ├─ *.controller.js
   │    ├─ *.routes.js
   │    └─ *.service.js   ← business logic separated from controllers
   ├─ middleware/         ← auth, rbac, error, rate-limit, upload, audit
   ├─ config/             ← env validation, db, redis, mongo
   ├─ jobs/               ← queue workers (email, pdf, reminders)
   └─ utils/
MongoDB Atlas  +  Redis  +  Object Storage (GridFS/S3)  +  SMTP
```
