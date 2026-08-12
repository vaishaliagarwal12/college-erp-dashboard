# College ERP — Improvement Plan

Scope: fixes and refinements to the **existing** implementation without changing the overall stack or architecture. Ordered by priority.

---

## 1. Security Fixes (Critical)

### 1.1 Protect all CRUD endpoints consistently
Auth is currently inconsistent:
- `students`: POST is protected (`Admin` only), but GET / PUT / DELETE are open (`server/routes/studentRoutes.js`).
- `faculty`, `departments`, `courses`: full CRUD is completely open.
- `dashboard/stats`: protected.

**Fix:** Apply `protect` at the router level and `authorize` per mutation route. Recommended matrix:

| Resource | Read | Create | Update | Delete |
|----------|------|--------|--------|--------|
| students | Admin, Faculty, Student | Admin | Admin, Faculty | Admin |
| faculty  | Admin, Faculty, Student | Admin | Admin | Admin |
| departments | All logged-in | Admin | Admin | Admin |
| courses  | All logged-in | Admin | Admin, Faculty | Admin |

### 1.2 Restrict registration
`POST /api/auth/register` is open — anyone can create an Admin account.

**Fix:** Either remove the route entirely and seed an initial admin, or gate it behind a `protect` + `authorize("SuperAdmin")` role, or require a registration secret/token.

### 1.3 Hardening middleware
Add to `app.js`:
- `helmet()` — security headers
- `express-rate-limit` — e.g. 100 req/15min general, strict limit (5 req/min) on `/api/auth/login`
- Restrict CORS to allowed origins instead of `cors()` wide open

### 1.4 JWT improvements
- Use a strong, randomly generated `JWT_SECRET` (move value to `.env` only, never hardcode).
- Optionally move the token to an `httpOnly` + `secure` cookie instead of the response body.
- Validate that `JWT_SECRET` and `JWT_EXPIRE` exist at boot (`dotenv-safe` or a config check).

### 1.5 Harden `protect` middleware
`server/middleware/auth.js:24` sets `req.admin = await Admin.findById(decoded.id)` but never checks the result. If the admin was deleted, `req.admin` is `null` and the later `authorize` middleware crashes on `req.admin.role`.

**Fix:**
```js
req.admin = await Admin.findById(decoded.id);
if (!req.admin) {
  return res.status(401).json({ success: false, message: "Not authorized. Account no longer exists." });
}
```
Also add `.select("-password")` on the lookup as defense-in-depth.

### 1.6 Stop leaking errors
All controllers return raw `error.message` on 500 (`server/controllers/*`). This exposes Mongo/connection internals.

**Fix:** Use the central error handler (see 2.1). Return generic messages for 500, and map known errors to correct codes:
- `CastError` (invalid ObjectId) → 400 "Invalid ID"
- `E11000` duplicate key → 409 "Already exists"
- `ValidationError` → 400 with field messages

### 1.7 Password policy
Raise `minlength` to 8 and consider a `match` confirmation field. Never log passwords or tokens.

---

## 2. Code Quality & Architecture

### 2.1 Central error handling
Every controller repeats `try { ... } catch { res.status(500).json(...) }`.

**Fix:** Introduce:
- `utils/asyncHandler.js` — wraps async route handlers, forwards errors to `next(err)`.
- `middleware/errorMiddleware.js` — centralized error handler mapping Mongoose/JWT/unknown errors to status codes.
- `app.js` 404 handler for unknown routes.
- Consistent response envelope: `{ success, message, data, ...meta }`.

### 2.2 Remove dead code
- `server/utils/generateToken.js` is an **empty file** (`server/utils/generateToken.js`). Delete it and move the token generation from `authController.js` into a real `utils/token.js`, or delete entirely and keep the inline version in one place.
- `server/Readme.md` is empty — either write it or remove it.

### 2.3 Fix formatting
Controllers and models have inconsistent indentation (e.g. `studentController.js:7-10`, `authController.js:21-26`, `Admin.js:26-30`). Run Prettier (or ESLint with `--fix`) across `server/`.

### 2.4 Pagination & consistent list responses
`getStudents` returns `count` = **current page length**, not the total number of matching documents, so the client can't build pagination controls.

**Fix:**
```js
const total = await Student.countDocuments(query);
res.json({ success: true, page, limit, total, pages: Math.ceil(total / limit), data: students });
```
Faculty / department / course lists currently have no pagination or filtering at all — add the same search/filter/pagination pattern as students.

### 2.5 Request validation layer
Add validation (zod / express-validator / Joi) for request bodies and URL params, checked **before** controllers. Return 400 with field-level messages instead of relying only on Mongoose validation.

### 2.6 Config management
- Add a `server/config/index.js` that reads and validates `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE` at startup.
- Fail fast with a clear message if required vars are missing.
- `package.json` `"main"` points to `index.js` which doesn't exist — fix to `server.js`.

---

## 3. Data Model Refinements

### 3.1 Referential integrity
`Student.course`, `Student.department`, `Faculty.department`, and `Course.department` are plain strings (`server/models/*`). Convert to `ObjectId` refs:

```js
department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true }
course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }
```
Then use `.populate()` in controllers. This prevents orphan records and enables `$lookup` aggregation.

### 3.2 Replace manual counters
`Department.totalFaculty` / `totalStudents` (`server/models/Department.js:25-33`) are manually maintained and will drift.

**Fix:** Compute on demand via `countDocuments` (dashboard-style aggregation) or via aggregation pipeline; drop the stored counters.

### 3.3 Unique-index error handling
Unique fields (email, rollNumber, employeeId, courseCode, departmentCode) throw `E11000` today → surfaces as a 500. Map to 409 via the error handler (see 2.1).

### 3.4 Consider a single auth/user model split
`Admin` is the only auth entity, with `role` enum covering `Admin / Faculty / Student` (`server/models/Admin.js`). As the system grows, either:
- keep `Admin` as the "users" collection and link `Faculty`/`Student` docs to a user `_id`, or
- split into a `User` base model with role-based sub-models.

---

## 4. Operational Improvements

### 4.1 Graceful shutdown
`server.js` should handle `SIGINT`/`SIGTERM` to close the Mongoose connection cleanly.

### 4.2 Environment hygiene
`.env` is correctly gitignored (good). Rotate the Mongo password and JWT secret since they were written in plaintext on disk and used in a committed repo context. Add `.env.example` documenting required vars.

### 4.3 Tests
Zero tests exist. Add:
- Unit: password hashing, token generation, auth middleware.
- Integration: CRUD flows for each resource with a test DB (e.g. `mongodb-memory-server`) using `supertest`.
- Script: `npm test` with a Node test runner or Vitest/Jest.

### 4.4 Readme
Write a proper `server/Readme.md` (or root `README.md`) documenting setup, env vars, run commands, and the API surface.

---

## 5. Frontend Parity (so the client actually uses the backend)

- Add a Vite dev proxy in `client/vite.config.js` (`/api` → `http://localhost:5000`).
- Create an axios instance (`client/src/api/`) with the JWT attached from storage.
- Login page + auth context (token + role).
- Replace hardcoded dashboard numbers in `client/src/pages/dashboard/dashboard.jsx` with `GET /api/dashboard/stats`.
- Add routing (react-router-dom is installed but unused) for login vs. dashboard.
- Build out Navbar / Sidebar placeholders.

---

## Suggested Execution Order

1. Central error handler + asyncHandler + 404 (2.1, 1.6, 2.3)
2. Protect all routes + restrict registration + harden `protect` (1.1, 1.2, 1.5)
3. Rate limiting + helmet + CORS restriction (1.3)
4. JWT/env hardening (1.4, 2.6)
5. Pagination consistency (2.4)
6. Validation layer (2.5)
7. Model normalization + remove manual counters (3.x)
8. Tests + graceful shutdown (4.x)
9. Frontend integration (5)
