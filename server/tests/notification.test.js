const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Notification = require("../models/Notification");
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

const seedUsers = async () => {
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
  });
  const student = await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });
  return { admin, student };
};

test("GET /api/v1/notifications — 401 without token", async () => {
  const res = await request(app).get("/api/v1/notifications");
  assert.equal(res.status, 401);
});

test("POST /api/v1/notifications — 201 creates a notification", async () => {
  const { admin, student } = await seedUsers();
  const token = generateAccessToken(admin._id);

  const res = await request(app)
    .post("/api/v1/notifications")
    .set(bearer(token))
    .send({ recipient: "student@test.com", title: "Fee Due", message: "Pay by 31st Dec", type: "Warning" });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.title, "Fee Due");
  assert.equal(res.body.data.read, false);

  const count = await Notification.countDocuments({ recipient: student._id });
  assert.equal(count, 1);
});

test("POST /api/v1/notifications — 403 for student role", async () => {
  const { student } = await seedUsers();
  const token = generateAccessToken(student._id);

  const res = await request(app)
    .post("/api/v1/notifications")
    .set(bearer(token))
    .send({ recipient: "student@test.com", title: "Nope" });

  assert.equal(res.status, 403);
});

test("GET /api/v1/notifications — returns own notifications only", async () => {
  const { admin, student } = await seedUsers();
  const adminToken = generateAccessToken(admin._id);

  await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "For student" });
  await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "admin@test.com", title: "For admin" });

  const studentToken = generateAccessToken(student._id);
  const res = await request(app).get("/api/v1/notifications").set(bearer(studentToken));

  assert.equal(res.status, 200);
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.data[0].title, "For student");
});

test("GET /api/v1/notifications/unread-count — counts unread", async () => {
  const { admin, student } = await seedUsers();
  const adminToken = generateAccessToken(admin._id);

  await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "One" });
  await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "Two" });

  const studentToken = generateAccessToken(student._id);
  const res = await request(app).get("/api/v1/notifications/unread-count").set(bearer(studentToken));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.unreadCount, 2);
});

test("PATCH /api/v1/notifications/:id/read — marks one as read", async () => {
  const { admin, student } = await seedUsers();
  const adminToken = generateAccessToken(admin._id);

  const created = await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "Read me" });

  const studentToken = generateAccessToken(student._id);
  const res = await request(app)
    .patch(`/api/v1/notifications/${created.body.data.id}/read`)
    .set(bearer(studentToken));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.read, true);
});

test("PATCH /api/v1/notifications/read-all — marks all as read", async () => {
  const { admin, student } = await seedUsers();
  const adminToken = generateAccessToken(admin._id);

  await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "One" });
  await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "Two" });

  const studentToken = generateAccessToken(student._id);
  const res = await request(app).patch("/api/v1/notifications/read-all").set(bearer(studentToken));

  assert.equal(res.status, 200);
  const unread = await Notification.countDocuments({ recipient: student._id, read: false });
  assert.equal(unread, 0);
});

test("PATCH /api/v1/notifications/:id/read — 404 for another user's notification", async () => {
  const { admin, student } = await seedUsers();
  const adminToken = generateAccessToken(admin._id);

  const created = await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "admin@test.com", title: "Admin only" });

  const studentToken = generateAccessToken(student._id);
  const res = await request(app)
    .patch(`/api/v1/notifications/${created.body.data.id}/read`)
    .set(bearer(studentToken));

  assert.equal(res.status, 404);
});

test("DELETE /api/v1/notifications/:id — deletes own notification", async () => {
  const { admin, student } = await seedUsers();
  const adminToken = generateAccessToken(admin._id);

  const created = await request(app)
    .post("/api/v1/notifications")
    .set(bearer(adminToken))
    .send({ recipient: "student@test.com", title: "Delete me" });

  const studentToken = generateAccessToken(student._id);
  const res = await request(app)
    .delete(`/api/v1/notifications/${created.body.data.id}`)
    .set(bearer(studentToken));

  assert.equal(res.status, 200);
  const count = await Notification.countDocuments({ recipient: student._id });
  assert.equal(count, 0);
});
