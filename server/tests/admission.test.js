const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Admission = require("../models/Admission");
const Student = require("../models/Student");
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

const seedData = async () => {
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
  });

  const studentUser = await User.create({
    name: "Student One",
    email: "student@test.com",
    password: "password123",
    role: "Student",
  });

  const dept = await Department.create({
    departmentName: "Computer Science",
    departmentCode: "CS",
    hod: "Dr. Admin",
  });

  const course = await Course.create({
    courseName: "Data Structures",
    courseCode: "CS201",
    department: dept._id,
    credits: 4,
    semester: 3,
  });

  return { admin, studentUser, dept, course };
};

const validBody = (course, dept, email = "applicant@test.com") => ({
  firstName: "New",
  lastName: "Student",
  email,
  phone: "9876543210",
  gender: "Male",
  course: course._id.toString(),
  department: dept._id.toString(),
  semester: 3,
  batch: 2026,
});

test("POST /api/v1/admissions — 401 without token", async () => {
  const res = await request(app).post("/api/v1/admissions").send({});
  assert.equal(res.status, 401);
});

test("POST /api/v1/admissions — 201 creates a pending application", async () => {
  const { studentUser, course, dept } = await seedData();
  const token = generateAccessToken(studentUser._id);

  const res = await request(app)
    .post("/api/v1/admissions")
    .set(bearer(token))
    .send(validBody(course, dept));

  assert.equal(res.status, 201);
  assert.equal(res.body.data.status, "Pending");
  assert.equal(res.body.data.email, "applicant@test.com");
});

test("POST /api/v1/admissions — 409 for duplicate pending email", async () => {
  const { studentUser, course, dept } = await seedData();
  const token = generateAccessToken(studentUser._id);

  await request(app).post("/api/v1/admissions").set(bearer(token)).send(validBody(course, dept));
  const res = await request(app).post("/api/v1/admissions").set(bearer(token)).send(validBody(course, dept));

  assert.equal(res.status, 409);
});

test("GET /api/v1/admissions — 403 for student role", async () => {
  const { studentUser } = await seedData();
  const token = generateAccessToken(studentUser._id);

  const res = await request(app).get("/api/v1/admissions").set(bearer(token));

  assert.equal(res.status, 403);
});

test("GET /api/v1/admissions/mine — returns own applications for students", async () => {
  const { studentUser, course, dept } = await seedData();
  const token = generateAccessToken(studentUser._id);

  await request(app).post("/api/v1/admissions").set(bearer(token)).send(validBody(course, dept));

  const res = await request(app).get("/api/v1/admissions/mine").set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.count, 1);
});

test("POST /api/v1/admissions/:id/approve — 200 enrolls student with roll number", async () => {
  const { admin, course, dept } = await seedData();
  const adminToken = generateAccessToken(admin._id);

  const created = await request(app)
    .post("/api/v1/admissions")
    .set(bearer(adminToken))
    .send(validBody(course, dept, "approve@test.com"));

  const res = await request(app)
    .post(`/api/v1/admissions/${created.body.data.id}/approve`)
    .set(bearer(adminToken));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "Approved");
  assert.ok(res.body.data.rollNumber);
  assert.ok(res.body.data.admissionNumber);
  assert.match(res.body.data.rollNumber, /^CS\d{6}$/);

  const student = await Student.findOne({ rollNumber: res.body.data.rollNumber });
  assert.ok(student);
  assert.equal(student.email, undefined);
  const user = await User.findOne({ email: "approve@test.com" });
  assert.ok(user);
  assert.equal(user.role, "Student");
});

test("POST /api/v1/admissions/:id/reject — 200 sets status to Rejected", async () => {
  const { admin, course, dept } = await seedData();
  const adminToken = generateAccessToken(admin._id);

  const created = await request(app)
    .post("/api/v1/admissions")
    .set(bearer(adminToken))
    .send(validBody(course, dept, "reject@test.com"));

  const res = await request(app)
    .post(`/api/v1/admissions/${created.body.data.id}/reject`)
    .set(bearer(adminToken))
    .send({ remarks: "Docs incomplete" });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "Rejected");
  assert.equal(res.body.data.remarks, "Docs incomplete");
});

test("POST /api/v1/admissions/:id/approve — 403 for student role", async () => {
  const { admin, studentUser, course, dept } = await seedData();
  const adminToken = generateAccessToken(admin._id);
  const studentToken = generateAccessToken(studentUser._id);

  const created = await request(app)
    .post("/api/v1/admissions")
    .set(bearer(adminToken))
    .send(validBody(course, dept, "approve2@test.com"));

  const res = await request(app)
    .post(`/api/v1/admissions/${created.body.data.id}/approve`)
    .set(bearer(studentToken));

  assert.equal(res.status, 403);
});
