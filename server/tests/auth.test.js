const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

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

test("POST /api/v1/auth/login — returns access + refresh token for valid credentials", async () => {
  await createUser();

  const res = await login("admin@test.com", "password123");

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.accessToken);
  assert.ok(res.body.refreshToken);
  assert.equal(res.body.data.email, "admin@test.com");
  assert.equal(res.body.data.role, "Admin");
});

test("POST /api/v1/auth/login — 401 for wrong password", async () => {
  await createUser();

  const res = await login("admin@test.com", "wrongpassword");

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test("POST /api/v1/auth/login — 401 for unknown email", async () => {
  const res = await login("nobody@test.com", "password123");

  assert.equal(res.status, 401);
});

test("POST /api/v1/auth/login — 401 for disabled account", async () => {
  await createUser({ status: "Inactive" });

  const res = await login("admin@test.com", "password123");

  assert.equal(res.status, 401);
});

test("POST /api/v1/auth/login — 400 for invalid email format", async () => {
  const res = await login("not-an-email", "password123");

  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
});

test("POST /api/v1/auth/login — 400 for missing password", async () => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "admin@test.com" });

  assert.equal(res.status, 400);
});

test("GET /api/v1/auth/me — 200 returns current user", async () => {
  const user = await createUser();

  const res = await request(app)
    .get("/api/v1/auth/me")
    .set(bearer(generateAccessToken(user._id)));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, "admin@test.com");
});

test("POST /api/v1/auth/refresh — rotates the token and returns a new access token", async () => {
  await createUser();
  const loginRes = await login("admin@test.com", "password123");
  const refreshToken = loginRes.body.refreshToken;

  const res = await request(app)
    .post("/api/v1/auth/refresh")
    .send({ refreshToken });

  assert.equal(res.status, 200);
  assert.ok(res.body.accessToken);
  assert.ok(res.body.refreshToken);
  assert.notEqual(res.body.refreshToken, refreshToken);
});

test("POST /api/v1/auth/refresh — rejects a reused refresh token", async () => {
  await createUser();
  const loginRes = await login("admin@test.com", "password123");
  const refreshToken = loginRes.body.refreshToken;

  await request(app).post("/api/v1/auth/refresh").send({ refreshToken });

  const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });

  assert.equal(res.status, 401);
});

test("POST /api/v1/auth/logout — revokes the refresh token", async () => {
  const user = await createUser();

  const res = await request(app)
    .post("/api/v1/auth/logout")
    .set(bearer(generateAccessToken(user._id)));

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test("POST /api/v1/auth/register — 401 without token", async () => {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "New", email: "new@test.com", password: "password123" });

  assert.equal(res.status, 401);
});

test("POST /api/v1/auth/register — 403 for non-admin roles", async () => {
  const student = await createUser({ email: "student@test.com", role: "Student" });

  const res = await request(app)
    .post("/api/v1/auth/register")
    .set(bearer(generateAccessToken(student._id)))
    .send({ name: "New", email: "new@test.com", password: "password123" });

  assert.equal(res.status, 403);
});

test("POST /api/v1/auth/register — 201 for admin creating another admin", async () => {
  const admin = await createUser();

  const res = await request(app)
    .post("/api/v1/auth/register")
    .set(bearer(generateAccessToken(admin._id)))
    .send({ name: "New Admin", email: "new@test.com", password: "password123" });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.email, "new@test.com");
});

test("POST /api/v1/auth/register — 409 for duplicate email", async () => {
  const admin = await createUser();

  const res = await request(app)
    .post("/api/v1/auth/register")
    .set(bearer(generateAccessToken(admin._id)))
    .send({ name: "Test Admin", email: "admin@test.com", password: "password123" });

  assert.equal(res.status, 409);
  assert.equal(res.body.message, "User already exists");
});

test("POST /api/v1/auth/register — 400 when password is too short", async () => {
  const admin = await createUser();

  const res = await request(app)
    .post("/api/v1/auth/register")
    .set(bearer(generateAccessToken(admin._id)))
    .send({ name: "New", email: "new@test.com", password: "short" });

  assert.equal(res.status, 400);
});
