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

  const student = await Student.create({
    user: studentUser._id,
    firstName: "Student",
    lastName: "One",
    rollNumber: "CS2023001",
    phone: "9876543210",
    gender: "Male",
    course: course._id,
    department: dept._id,
    semester: 3,
    batch: 2023,
    section: "A",
  });

  return { admin, studentUser, student };
};

test("GET /api/v1/export/students — 401 without token", async () => {
  const res = await request(app).get("/api/v1/export/students");
  assert.equal(res.status, 401);
});

test("GET /api/v1/export/students — 200 returns CSV with header and rows", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const res = await request(app).get("/api/v1/export/students").set(bearer(token));

  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/csv/);
  assert.match(res.headers["content-disposition"], /attachment/);
  assert.ok(res.text.startsWith("rollNumber,firstName,lastName"));
  assert.ok(res.text.includes("CS2023001"));
  assert.ok(res.text.includes("student@test.com"));
});

test("GET /api/v1/export/faculty — 200 returns CSV even when empty", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const res = await request(app).get("/api/v1/export/faculty").set(bearer(token));

  assert.equal(res.status, 200);
  assert.ok(res.text.startsWith("employeeId,firstName,lastName"));
});

test("GET /api/v1/export/fees — 403 for student role", async () => {
  const { studentUser } = await seedData();
  const token = generateAccessToken(studentUser._id);

  const res = await request(app).get("/api/v1/export/fees").set(bearer(token));

  assert.equal(res.status, 403);
});
