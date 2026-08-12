const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();
// Enable the login gate — must be set before requiring ../app
process.env.REQUIRE_EMAIL_VERIFICATION = "true";

const app = require("../app");
const User = require("../models/User");
const { generateAccessToken } = require("../utils/token");

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

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

test("POST /api/v1/auth/login — 403 for an unverified email when gate is on", async () => {
  await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });

  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "student@test.com", password: "password123" });

  assert.equal(res.status, 403);
  assert.match(res.body.message, /verify/i);
});

test("POST /api/v1/auth/login — 200 once the email is verified", async () => {
  await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
    emailVerified: true,
  });

  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "student@test.com", password: "password123" });

  assert.equal(res.status, 200);
  assert.ok(res.body.accessToken);
});

test("POST /api/v1/auth/verify-email — unlocks login for a registered user", async () => {
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
    emailVerified: true,
  });

  const reg = await request(app)
    .post("/api/v1/auth/register")
    .set(bearer(generateAccessToken(admin._id)))
    .send({ name: "New User", email: "new@test.com", password: "password123" });
  assert.equal(reg.status, 201);

  const blocked = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "new@test.com", password: "password123" });
  assert.equal(blocked.status, 403);

  const verify = await request(app)
    .post("/api/v1/auth/verify-email")
    .send({ token: reg.body.verificationToken });
  assert.equal(verify.status, 200);

  const allowed = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "new@test.com", password: "password123" });
  assert.equal(allowed.status, 200);
});
