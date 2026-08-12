# College ERP — Backend

REST API for the College ERP system built with **Node.js (CommonJS) + Express 5 + Mongoose 9**.

## Tech Stack

- Express 5 — HTTP framework
- Mongoose 9 — MongoDB ODM (MongoDB Atlas)
- JSON Web Tokens (jsonwebtoken) — authentication
- bcryptjs — password hashing
- zod — request validation
- helmet — security headers
- express-rate-limit — brute-force protection
- Node.js built-in test runner (`node --test`) + supertest + mongodb-memory-server

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env` with your values. Required variables:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (production: `openssl rand -hex 64`) |
| `JWT_EXPIRE` | e.g. `7d` |
| `PORT` | Server port (default `5000`) |
| `CLIENT_URL` | Allowed frontend origin (default `http://localhost:5173`) |
| `CORS_ORIGIN` | Comma-separated allowed CORS origins |

> Never commit `server/.env` — it is gitignored. Always keep `.env.example` in sync.

### 3. Run

```bash
# development (auto-restart)
npm run dev

# production
npm start
```

### 4. Seed the first admin

Registration is admin-only by design. Create the first admin with:

```bash
# set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env
npm run seed:admin
```

Then use `POST /api/auth/login` to get a token, and `POST /api/auth/register`
(admin role required) to create additional accounts.

### 5. Tests

```bash
npm test
```

Tests run against an in-memory MongoDB (`mongodb-memory-server`) and never
touch your real database. The first run downloads a `mongod` binary
(one-time, cached). To force a specific version:

```bash
# set in server/tests/helpers.js or as env var MONGOMS_VERSION
MONGOMS_VERSION=7.0.14 npm test
```

## API Surface

Base URL: `http://localhost:5000/api`

All endpoints except `/api/auth/login` require a Bearer token:
`Authorization: Bearer <token>`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/register` | Admin | Create admin/faculty/student account |
| GET | `/api/dashboard/stats` | Any authenticated | Students/faculty/departments/courses counts |
| GET | `/api/students` | Any authenticated | List with `search`, `department`, `semester`, `status`, `page`, `limit` |
| GET | `/api/students/:id` | Any authenticated | Single student |
| POST | `/api/students` | Admin | Create student |
| PUT | `/api/students/:id` | Admin, Faculty | Update student |
| DELETE | `/api/students/:id` | Admin | Delete student |
| GET | `/api/faculty` | Any authenticated | List with `search`, `department`, `status`, `page`, `limit` |
| GET | `/api/faculty/:id` | Any authenticated | Single faculty |
| POST | `/api/faculty` | Admin | Create faculty |
| PUT | `/api/faculty/:id` | Admin | Update faculty |
| DELETE | `/api/faculty/:id` | Admin | Delete faculty |
| GET | `/api/departments` | Any authenticated | List with `search`, `status`, `page`, `limit` |
| GET | `/api/departments/:id` | Any authenticated | Single department |
| POST | `/api/departments` | Admin | Create department |
| PUT | `/api/departments/:id` | Admin | Update department |
| DELETE | `/api/departments/:id` | Admin | Delete department |
| GET | `/api/courses` | Any authenticated | List with `search`, `department`, `semester`, `status`, `page`, `limit` |
| GET | `/api/courses/:id` | Any authenticated | Single course |
| POST | `/api/courses` | Admin | Create course |
| PUT | `/api/courses/:id` | Admin, Faculty | Update course |
| DELETE | `/api/courses/:id` | Admin | Delete course |

### Response envelope

All responses use a consistent shape:

```json
{ "success": true, "message": "optional", "data": {}, "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 } }
```

Errors:

```json
{ "success": false, "message": "reason", "errors": [ { "field": "email", "message": "..." } ] }
```

| Status | Meaning |
|---|---|
| 400 | Validation error / invalid ID |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but not allowed |
| 404 | Not found |
| 409 | Duplicate value |
| 429 | Rate limited |
| 500 | Server error (details never leaked) |

## Project Structure

```
server/
├── app.js                 Express app (security, routes, 404, error handler)
├── server.js              Entrypoint + graceful shutdown
├── config/
│   ├── index.js           Env validation + central config
│   ├── database.js        Mongoose connection
│   └── roles.js           Role constants
├── controllers/           Route handlers (asyncHandler based)
├── middleware/
│   ├── auth.js            protect + authorize
│   ├── errorMiddleware.js 404 + central error handler
│   ├── rateLimiter.js     General + auth rate limits
│   └── validate.js        Zod request validation
├── models/                Mongoose models (Admin, Student, Faculty, Department, Course)
├── routes/                Express routers
├── scripts/seedAdmin.js   First-admin seeder
├── utils/                 asyncHandler, AppError, token, pagination, escapeRegex
├── validators/            Zod schemas
└── tests/                 Node test runner + supertest + in-memory DB
```

## Security Notes

- All write endpoints are role-restricted (see table above).
- Passwords are bcrypt-hashed and never returned.
- Rate limiting applies to `/api` (100 req / 15 min) and login (5 req / min).
- CORS is restricted to `CORS_ORIGIN`.
- Production should use a strong `JWT_SECRET` — rotate it to invalidate old tokens.

## Roadmap Reference

Refinement and upgrade plans live in `../improvement.md` and `../upgradtion.md`
at the repository root.
