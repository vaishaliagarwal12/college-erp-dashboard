const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const fs = require("fs");
const path = require("path");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
process.env.REPORT_DIR = path.join(require("os").tmpdir(), "erp-test-reports");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Fee = require("../models/Fee");
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

const seedAdmin = async (role = "Admin") =>
  User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "password123",
    role,
  });

const seedOverdueFee = async () => {
  const user = await User.create({
    name: "Student One",
    email: "student1@test.com",
    password: "password123",
    role: "Student",
  });
  const department = await Department.create({
    departmentName: "Computer Science",
    departmentCode: "CS",
    hod: "Dr. A",
  });
  const course = await Course.create({
    courseName: "Data Structures",
    courseCode: "CS201",
    department,
    credits: 4,
    semester: 3,
  });
  const student = await Student.create({
    user: user._id,
    firstName: "Student",
    lastName: "One",
    rollNumber: "S2026001",
    phone: "1234567890",
    gender: "Male",
    course: course._id,
    department: department._id,
    semester: 3,
    batch: 2026,
    section: "A",
  });
  await Fee.create({
    student: student._id,
    semester: 3,
    totalAmount: 5000,
    amountPaid: 0,
    dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  });
  return { student, user };
};

test("GET /api/v1/jobs/health — reports the queue backend", async () => {
  const admin = await seedAdmin();
  const res = await request(app)
    .get("/api/v1/jobs/health")
    .set(bearer(generateAccessToken(admin._id)));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.backend, "in-memory");
});

test("GET /api/v1/jobs/health — 401 without token", async () => {
  const res = await request(app).get("/api/v1/jobs/health");
  assert.equal(res.status, 401);
});

test("POST /api/v1/jobs/fee-reminders — processes outstanding balances (dry run)", async () => {
  const admin = await seedAdmin();
  await seedOverdueFee();

  const res = await request(app)
    .post("/api/v1/jobs/fee-reminders")
    .set(bearer(generateAccessToken(admin._id)))
    .send({ dryRun: true, daysOverdue: 30 });

  assert.equal(res.status, 202);
  assert.equal(res.body.data.backend, "in-memory");
  assert.equal(res.body.data.job.result.count, 1);
  assert.equal(res.body.data.job.result.recipients[0].rollNumber, "S2026001");
});

test("POST /api/v1/jobs/reports/fees — generates a CSV report", async () => {
  const admin = await seedAdmin();
  await seedOverdueFee();

  const res = await request(app)
    .post("/api/v1/jobs/reports/fees")
    .set(bearer(generateAccessToken(admin._id)));

  assert.equal(res.status, 202);
  const { result } = res.body.data.job;
  assert.equal(result.type, "fees");
  assert.ok(result.rows >= 1);
  assert.equal(fs.existsSync(result.filePath), true);
  const csv = fs.readFileSync(result.filePath, "utf8");
  assert.match(csv, /rollNumber/);
  assert.match(csv, /S2026001/);
});

test("POST /api/v1/jobs/email — enqueues a generic email job", async () => {
  const admin = await seedAdmin();
  const res = await request(app)
    .post("/api/v1/jobs/email")
    .set(bearer(generateAccessToken(admin._id)))
    .send({ to: "recipient@test.com", subject: "Hello", text: "Hi" });

  assert.equal(res.status, 202);
  assert.equal(res.body.data.job.name, "email");
});

test("POST /api/v1/jobs/email — 400 when to/subject are missing", async () => {
  const admin = await seedAdmin();
  const res = await request(app)
    .post("/api/v1/jobs/email")
    .set(bearer(generateAccessToken(admin._id)))
    .send({});

  assert.equal(res.status, 400);
});
