const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
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

const createUser = async (role, email) => {
  const user = await User.create({
    name: role,
    email,
    password: "password123",
    role,
  });
  return generateAccessToken(user._id);
};

test("POST /api/v1/faculty — 403 for Faculty role (permission map)", async () => {
  const token = await createUser("Faculty", "faculty@test.com");

  const res = await request(app)
    .post("/api/v1/faculty")
    .set("Authorization", `Bearer ${token}`)
    .send({ firstName: "Jane" });

  assert.equal(res.status, 403);
});

test("GET /api/v1/users — denied for Faculty, allowed for Admin", async () => {
  const facultyToken = await createUser("Faculty", "faculty@test.com");
  const denied = await request(app)
    .get("/api/v1/users")
    .set("Authorization", `Bearer ${facultyToken}`);
  assert.equal(denied.status, 403);

  const adminToken = await createUser("Admin", "admin@test.com");
  const allowed = await request(app)
    .get("/api/v1/users")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(allowed.status, 200);
});

test("DELETE /api/v1/users/:id — Admin denied, SuperAdmin allowed", async () => {
  const target = await User.create({
    name: "Target",
    email: "target@test.com",
    password: "password123",
    role: "Registrar",
  });

  const adminToken = await createUser("Admin", "admin@test.com");
  const denied = await request(app)
    .delete(`/api/v1/users/${target._id}`)
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(denied.status, 403);

  const superToken = await createUser("SuperAdmin", "super@test.com");
  const allowed = await request(app)
    .delete(`/api/v1/users/${target._id}`)
    .set("Authorization", `Bearer ${superToken}`);
  assert.equal(allowed.status, 200);
});

test("user cannot delete their own account", async () => {
  const user = await User.create({
    name: "Super",
    email: "super@test.com",
    password: "password123",
    role: "SuperAdmin",
  });

  const res = await request(app)
    .delete(`/api/v1/users/${user._id}`)
    .set("Authorization", `Bearer ${generateAccessToken(user._id)}`);

  assert.equal(res.status, 400);
});

test("POST /api/v1/users — creates an account that can log in", async () => {
  const adminToken = await createUser("Admin", "admin@test.com");

  const created = await request(app)
    .post("/api/v1/users")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "Registrar One",
      email: "registrar1@test.com",
      password: "password123",
      role: "Registrar",
    });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.role, "Registrar");

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "registrar1@test.com", password: "password123" });

  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body.data.role, "Registrar");
});

test("audit log records create actions", async () => {
  const adminToken = await createUser("Admin", "admin@test.com");

  await request(app)
    .post("/api/v1/departments")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      departmentName: "Electronics",
      departmentCode: "ECE",
      hod: "Dr. Rao",
    });

  const logs = await AuditLog.countDocuments({ module: "departments", action: "create" });
  assert.equal(logs, 1);

  const res = await request(app)
    .get("/api/v1/audit")
    .set("Authorization", `Bearer ${adminToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data[0].module, "departments");
  assert.equal(res.body.data[0].action, "create");
});

test("GET /api/v1/audit — denied for Faculty", async () => {
  const facultyToken = await createUser("Faculty", "faculty@test.com");

  const res = await request(app)
    .get("/api/v1/audit")
    .set("Authorization", `Bearer ${facultyToken}`);

  assert.equal(res.status, 403);
});
