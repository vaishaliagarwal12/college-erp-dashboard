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
const Attendance = require("../models/Attendance");
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

  return { admin, student, course, dept };
};

const markAttendance = (token, body) =>
  request(app).post("/api/v1/attendance").set(bearer(token)).send(body);

test("POST /api/v1/attendance — 401 without token", async () => {
  const res = await request(app)
    .post("/api/v1/attendance")
    .send({ student: "CS2023001", course: "CS201", date: "2026-08-01", status: "Present" });

  assert.equal(res.status, 401);
});

test("POST /api/v1/attendance — 201 marks attendance", async () => {
  const { admin, student, course } = await seedData();
  const token = generateAccessToken(admin._id);

  const res = await markAttendance(token, {
    student: "CS2023001",
    course: "CS201",
    date: "2026-08-01",
    period: "1",
    status: "Present",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, "Present");
  assert.equal(res.body.data.student.rollNumber, "CS2023001");

  const count = await Attendance.countDocuments({ student: student._id, course: course._id });
  assert.equal(count, 1);
});

test("POST /api/v1/attendance — 409 for duplicate marking", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const body = { student: "CS2023001", course: "CS201", date: "2026-08-01", period: "1", status: "Present" };
  await markAttendance(token, body);

  const res = await markAttendance(token, body);
  assert.equal(res.status, 409);
});

test("POST /api/v1/attendance — 403 for student role", async () => {
  const { student } = await seedData();
  const studentUser = await User.findById(student.user);
  const token = generateAccessToken(studentUser._id);

  const res = await markAttendance(token, {
    student: "CS2023001",
    course: "CS201",
    date: "2026-08-01",
    status: "Present",
  });

  assert.equal(res.status, 403);
});

test("POST /api/v1/attendance/bulk — 201 upserts records", async () => {
  const { admin, student } = await seedData();
  const token = generateAccessToken(admin._id);

  const res = await request(app)
    .post("/api/v1/attendance/bulk")
    .set(bearer(token))
    .send({
      records: [
        { student: "CS2023001", course: "CS201", date: "2026-08-01", period: "1", status: "Present" },
        { student: "CS2023001", course: "CS201", date: "2026-08-01", period: "2", status: "Absent" },
      ],
    });

  assert.equal(res.status, 201);
  const count = await Attendance.countDocuments({ student: student._id });
  assert.equal(count, 2);
});

test("GET /api/v1/attendance/summary — computes percentages", async () => {
  const { admin, student } = await seedData();
  const token = generateAccessToken(admin._id);

  await markAttendance(token, { student: "CS2023001", course: "CS201", date: "2026-08-01", period: "1", status: "Present" });
  await markAttendance(token, { student: "CS2023001", course: "CS201", date: "2026-08-02", period: "1", status: "Present" });
  await markAttendance(token, { student: "CS2023001", course: "CS201", date: "2026-08-03", period: "1", status: "Absent" });

  const res = await request(app).get("/api/v1/attendance/summary").set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.count, 1);
  assert.equal(res.body.data[0].total, 3);
  assert.equal(res.body.data[0].percentage, 66.67);
});

test("PUT /api/v1/attendance/:id — updates a record", async () => {
  const { admin, student } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await markAttendance(token, {
    student: "CS2023001",
    course: "CS201",
    date: "2026-08-01",
    status: "Present",
  });

  const res = await request(app)
    .put(`/api/v1/attendance/${created.body.data.id}`)
    .set(bearer(token))
    .send({ status: "On Leave" });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "On Leave");
});

test("DELETE /api/v1/attendance/:id — deletes a record", async () => {
  const { admin, student } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await markAttendance(token, {
    student: "CS2023001",
    course: "CS201",
    date: "2026-08-01",
    status: "Present",
  });

  const res = await request(app)
    .delete(`/api/v1/attendance/${created.body.data.id}`)
    .set(bearer(token));

  assert.equal(res.status, 200);
  const count = await Attendance.countDocuments({ student: student._id });
  assert.equal(count, 0);
});
