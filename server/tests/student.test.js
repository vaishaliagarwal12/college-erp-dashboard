const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Student = require("../models/Student");
const { generateAccessToken } = require("../utils/token");

let mongo;
let dept;
let course;

before(async () => {
  mongo = await startDb();
});

after(async () => {
  await stopDb(mongo);
});

beforeEach(async () => {
  await clearDb();
  dept = await Department.create({
    departmentName: "Computer Science",
    departmentCode: "CSE",
    hod: "Dr. Smith",
  });
  course = await Course.create({
    courseName: "B.Tech Computer Science",
    courseCode: "BTCSE",
    department: dept._id,
    credits: 4,
    semester: 3,
  });
});

const tokenFor = async ({ role, email }) => {
  // Reuse the same account across calls within a test (unique email index)
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name: role, email, password: "password123", role });
  }
  return generateAccessToken(user._id);
};

const adminToken = () => tokenFor({ role: "Admin", email: "admin@test.com" });
const facultyToken = () => tokenFor({ role: "Faculty", email: "faculty@test.com" });
const studentToken = () => tokenFor({ role: "Student", email: "student@test.com" });

const validStudent = {
  firstName: "John",
  lastName: "Doe",
  rollNumber: "CS2026-001",
  email: "john.doe@test.com",
  phone: "1234567890",
  gender: "Male",
  course: "BTCSE",
  department: "CSE",
  semester: 3,
  batch: 2026,
  section: "A",
};

test("GET /api/v1/students — 401 without token", async () => {
  const res = await request(app).get("/api/v1/students");
  assert.equal(res.status, 401);
});

test("GET /api/v1/students — 200 empty list with pagination meta", async () => {
  const res = await request(app)
    .get("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.data, []);
  assert.equal(res.body.pagination.total, 0);
});

test("POST /api/v1/students — 201 create as Admin with resolved refs", async () => {
  const res = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  assert.equal(res.status, 201);
  assert.equal(res.body.data.rollNumber, validStudent.rollNumber);
  assert.equal(res.body.data.user.email, validStudent.email);
  assert.equal(res.body.data.department.code, "CSE");
  assert.equal(res.body.data.course.code, "BTCSE");
});

test("POST /api/v1/students — 403 for Student role", async () => {
  const res = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await studentToken()}`)
    .send(validStudent);

  assert.equal(res.status, 403);
});

test("POST /api/v1/students — 400 for invalid body", async () => {
  const res = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send({ firstName: "", semester: 99 });

  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
});

test("POST /api/v1/students — 409 for duplicate email", async () => {
  await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  const res = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  assert.equal(res.status, 409);
});

test("GET /api/v1/students — search filters by user email", async () => {
  await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send({ ...validStudent, rollNumber: "EC2026-002", email: "jane@test.com" });

  const res = await request(app)
    .get("/api/v1/students?search=jane")
    .set("Authorization", `Bearer ${await adminToken()}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.data[0].user.email, "jane@test.com");
});

test("GET /api/v1/students/:id — 200 for existing student", async () => {
  const created = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  const res = await request(app)
    .get(`/api/v1/students/${created.body.data.id}`)
    .set("Authorization", `Bearer ${await adminToken()}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.rollNumber, validStudent.rollNumber);
});

test("GET /api/v1/students/:id — 404 for missing student", async () => {
  const res = await request(app)
    .get("/api/v1/students/665000000000000000000000")
    .set("Authorization", `Bearer ${await adminToken()}`);

  assert.equal(res.status, 404);
});

test("GET /api/v1/students/:id — 400 for invalid ObjectId", async () => {
  const res = await request(app)
    .get("/api/v1/students/not-an-id")
    .set("Authorization", `Bearer ${await adminToken()}`);

  assert.equal(res.status, 400);
});

test("PUT /api/v1/students/:id — 200 as Faculty", async () => {
  const created = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  const res = await request(app)
    .put(`/api/v1/students/${created.body.data.id}`)
    .set("Authorization", `Bearer ${await facultyToken()}`)
    .send({ section: "B" });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.section, "B");
});

test("DELETE /api/v1/students/:id — 403 for Faculty", async () => {
  const created = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  const res = await request(app)
    .delete(`/api/v1/students/${created.body.data.id}`)
    .set("Authorization", `Bearer ${await facultyToken()}`);

  assert.equal(res.status, 403);
});

test("DELETE /api/v1/students/:id — 200 as Admin and removes linked user", async () => {
  const created = await request(app)
    .post("/api/v1/students")
    .set("Authorization", `Bearer ${await adminToken()}`)
    .send(validStudent);

  const res = await request(app)
    .delete(`/api/v1/students/${created.body.data.id}`)
    .set("Authorization", `Bearer ${await adminToken()}`);

  assert.equal(res.status, 200);
  const remaining = await Student.countDocuments();
  assert.equal(remaining, 0);
  const users = await User.countDocuments({ email: validStudent.email });
  assert.equal(users, 0);
});
