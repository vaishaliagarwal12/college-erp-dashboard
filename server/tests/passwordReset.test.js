const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const { generateResetToken } = require("../utils/token");

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

test("POST /api/v1/auth/forgot-password — 400 for invalid email", async () => {
  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({ email: "not-an-email" });

  assert.equal(res.status, 400);
});

test("POST /api/v1/auth/forgot-password — 200 for unknown email (no account leak)", async () => {
  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({ email: "nobody@test.com" });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.resetToken, undefined);
});

test("POST /api/v1/auth/forgot-password — 200 returns reset token for existing user", async () => {
  await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });

  const res = await request(app)
    .post("/api/v1/auth/forgot-password")
    .send({ email: "student@test.com" });

  assert.equal(res.status, 200);
  assert.ok(res.body.resetToken);
  assert.ok(res.body.resetLink.includes("/reset-password"));
});

test("POST /api/v1/auth/reset-password — 400 for invalid token", async () => {
  const res = await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ token: "garbage", password: "newpassword123" });

  assert.equal(res.status, 400);
});

test("POST /api/v1/auth/reset-password — 400 when password is too short", async () => {
  const user = await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });
  const token = generateResetToken(user._id);

  const res = await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ token, password: "short" });

  assert.equal(res.status, 400);
});

test("POST /api/v1/auth/reset-password — 200 resets password and allows login", async () => {
  const user = await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });
  const token = generateResetToken(user._id);

  const res = await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ token, password: "newpassword123" });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const failed = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "student@test.com", password: "password123" });
  assert.equal(failed.status, 401);

  const ok = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "student@test.com", password: "newpassword123" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.accessToken);
});

test("POST /api/v1/auth/reset-password — revokes existing refresh tokens", async () => {
  const user = await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "student@test.com", password: "password123" });

  const token = generateResetToken(user._id);
  await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ token, password: "newpassword123" });

  const refreshRes = await request(app)
    .post("/api/v1/auth/refresh")
    .send({ refreshToken: login.body.refreshToken });

  assert.equal(refreshRes.status, 401);
});
