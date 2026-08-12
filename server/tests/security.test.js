const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();
// Expire passwords after 30 days so the expiry flag can be exercised
process.env.PASSWORD_MAX_AGE_DAYS = "30";

const app = require("../app");
const User = require("../models/User");
const { generateAccessToken, generateVerifyToken } = require("../utils/token");

let mongo;

before(async () => {
  mongo = await startDb();
});

after(async () => {
  await stopDb(mongo);
});

beforeEach(async () => {
  await clearDb();
});

const createUser = async (overrides = {}) => {
  return User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
    ...overrides,
  });
};

const login = (email, password) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

const registerUser = (token, body) =>
  request(app)
    .post("/api/v1/auth/register")
    .set(bearer(token))
    .send({ name: "New User", email: "new@test.com", password: "password123", ...body });

// ---- Login lockout ----

test("POST /api/v1/auth/login — locks account after repeated failures", async () => {
  await createUser();

  for (let i = 0; i < 2; i++) {
    const res = await login("admin@test.com", "wrongpassword");
    assert.equal(res.status, 401);
  }

  const res = await login("admin@test.com", "wrongpassword");
  assert.equal(res.status, 429);
  assert.match(res.body.message, /locked/i);

  // Correct password is still rejected while the account is locked
  const locked = await login("admin@test.com", "password123");
  assert.equal(locked.status, 429);
});

test("POST /api/v1/auth/login — successful login resets failed attempts", async () => {
  await createUser();

  await login("admin@test.com", "wrongpassword");
  await login("admin@test.com", "wrongpassword");

  const ok = await login("admin@test.com", "password123");
  assert.equal(ok.status, 200);

  // One short of the limit, then a failure resets back to a single attempt
  const again = await login("admin@test.com", "wrongpassword");
  assert.equal(again.status, 401);
});

// ---- Email verification ----

test("POST /api/v1/auth/register — returns a verification token and link", async () => {
  const admin = await createUser();

  const res = await registerUser(generateAccessToken(admin._id));

  assert.equal(res.status, 201);
  assert.equal(res.body.data.emailVerified, false);
  assert.ok(res.body.verificationToken);
  assert.match(res.body.verifyLink, /\/verify-email\?token=/);
});

test("POST /api/v1/auth/verify-email — 200 verifies a valid token", async () => {
  const admin = await createUser();
  const reg = await registerUser(generateAccessToken(admin._id));

  const user = await User.findOne({ email: "new@test.com" });
  assert.equal(user.emailVerified, false);

  const res = await request(app)
    .post("/api/v1/auth/verify-email")
    .send({ token: reg.body.verificationToken });

  assert.equal(res.status, 200);
  assert.equal(res.body.message, "Email verified successfully");

  const verified = await User.findOne({ email: "new@test.com" });
  assert.equal(verified.emailVerified, true);
});

test("POST /api/v1/auth/verify-email — 400 for an invalid token", async () => {
  const res = await request(app)
    .post("/api/v1/auth/verify-email")
    .send({ token: "bogus-token" });

  assert.equal(res.status, 400);
});

test("POST /api/v1/auth/verify-email — idempotent when already verified", async () => {
  const user = await createUser({ emailVerified: true });

  const res = await request(app)
    .post("/api/v1/auth/verify-email")
    .send({ token: generateVerifyToken(user._id) });

  assert.equal(res.status, 200);
  assert.equal(res.body.message, "Email already verified");
});

test("POST /api/v1/auth/resend-verification — returns a fresh token for an unverified user", async () => {
  const admin = await createUser();
  await registerUser(generateAccessToken(admin._id));

  const res = await request(app)
    .post("/api/v1/auth/resend-verification")
    .send({ email: "new@test.com" });

  assert.equal(res.status, 200);
  assert.ok(res.body.verificationToken);
});

test("POST /api/v1/auth/resend-verification — no account leak for unknown email", async () => {
  const res = await request(app)
    .post("/api/v1/auth/resend-verification")
    .send({ email: "nobody@test.com" });

  assert.equal(res.status, 200);
  assert.equal(res.body.verificationToken, undefined);
});

// ---- Password change ----

test("POST /api/v1/auth/change-password — 401 without token", async () => {
  const res = await request(app)
    .post("/api/v1/auth/change-password")
    .send({ currentPassword: "password123", newPassword: "newpassword456" });

  assert.equal(res.status, 401);
});

test("POST /api/v1/auth/change-password — 401 for wrong current password", async () => {
  const user = await createUser();

  const res = await request(app)
    .post("/api/v1/auth/change-password")
    .set(bearer(generateAccessToken(user._id)))
    .send({ currentPassword: "wrongpassword", newPassword: "newpassword456" });

  assert.equal(res.status, 401);
});

test("POST /api/v1/auth/change-password — 200 updates the password", async () => {
  const user = await createUser();

  const res = await request(app)
    .post("/api/v1/auth/change-password")
    .set(bearer(generateAccessToken(user._id)))
    .send({ currentPassword: "password123", newPassword: "newpassword456" });

  assert.equal(res.status, 200);

  const oldLogin = await login("admin@test.com", "password123");
  assert.equal(oldLogin.status, 401);

  const newLogin = await login("admin@test.com", "newpassword456");
  assert.equal(newLogin.status, 200);
});

test("POST /api/v1/auth/change-password — 400 when reusing a recent password", async () => {
  const user = await createUser();
  const token = generateAccessToken(user._id);

  await request(app)
    .post("/api/v1/auth/change-password")
    .set(bearer(token))
    .send({ currentPassword: "password123", newPassword: "newpassword456" });

  await request(app)
    .post("/api/v1/auth/change-password")
    .set(bearer(token))
    .send({ currentPassword: "newpassword456", newPassword: "thirdpassword789" });

  // Going back to a previously used password is rejected
  const res = await request(app)
    .post("/api/v1/auth/change-password")
    .set(bearer(token))
    .send({ currentPassword: "thirdpassword789", newPassword: "newpassword456" });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /recent/i);
});

// ---- Password reset reuse ----

test("POST /api/v1/auth/reset-password — 400 when resetting to the current password", async () => {
  await createUser();

  const forgot = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({ email: "admin@test.com" });
  assert.equal(forgot.status, 200);

  const res = await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ token: forgot.body.resetToken, password: "password123" });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /recent/i);
});

// ---- Password expiry ----

test("POST /api/v1/auth/login — passwordExpired true after max age", async () => {
  const user = await createUser();
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordChangedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } }
  );

  const res = await login("admin@test.com", "password123");

  assert.equal(res.status, 200);
  assert.equal(res.body.passwordExpired, true);
});

test("POST /api/v1/auth/login — passwordExpired false for a fresh password", async () => {
  await createUser();

  const res = await login("admin@test.com", "password123");

  assert.equal(res.status, 200);
  assert.equal(res.body.passwordExpired, false);
});

test("GET /api/v1/auth/me — returns emailVerified and passwordExpired", async () => {
  const user = await createUser();

  const res = await request(app)
    .get("/api/v1/auth/me")
    .set(bearer(generateAccessToken(user._id)));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.emailVerified, false);
  assert.equal(res.body.passwordExpired, false);
});
