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

const token = async () => {
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
  });
  return generateAccessToken(admin._id);
};

test("GET /api/v1/unknown — 404 with consistent error shape", async () => {
  const res = await request(app).get("/api/v1/unknown-route");

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.ok(res.body.message);
});

test("unexpected route for authenticated resource — 401 keeps error shape", async () => {
  const res = await request(app).get("/api/v1/students");

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Not authorized. No token provided.");
});

test("protected resource — 401 for tampered token", async () => {
  const res = await request(app)
    .get("/api/v1/students")
    .set("Authorization", "Bearer invalid.token.here");

  assert.equal(res.status, 401);
});

test("protected resource — 401 for valid-signed but expired token", async () => {
  const jwt = require("jsonwebtoken");
  const expired = jwt.sign({ id: "665000000000000000000000" }, "test-secret-key", {
    expiresIn: -10,
  });

  const res = await request(app)
    .get("/api/v1/students")
    .set("Authorization", `Bearer ${expired}`);

  assert.equal(res.status, 401);
});

test("protected resource — 401 when account no longer exists", async () => {
  const stale = jwtSign("665000000000000000000000");

  const res = await request(app)
    .get("/api/v1/students")
    .set("Authorization", `Bearer ${stale}`);

  assert.equal(res.status, 401);
});

test("protected resource — 401 for disabled account", async () => {
  const disabled = await User.create({
    name: "Disabled",
    email: "disabled@test.com",
    password: "password123",
    role: "Student",
    status: "Inactive",
  });

  const res = await request(app)
    .get("/api/v1/students")
    .set("Authorization", `Bearer ${generateAccessToken(disabled._id)}`);

  assert.equal(res.status, 401);
});

const jwtSign = (id) => {
  const jwt = require("jsonwebtoken");
  return jwt.sign({ id }, "test-secret-key", { expiresIn: "1h" });
};
