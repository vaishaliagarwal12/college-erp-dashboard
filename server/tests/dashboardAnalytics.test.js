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
const Exam = require("../models/Exam");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Result = require("../models/Result");
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

const seedAll = async () => {
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
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

  const students = [];
  for (let i = 1; i <= 2; i++) {
    const user = await User.create({
      name: `Student ${i}`,
      email: `student${i}@test.com`,
      password: "password123",
      role: "Student",
    });
    students.push(
      await Student.create({
        user: user._id,
        firstName: `Student${i}`,
        lastName: "One",
        rollNumber: `CS202300${i}`,
        phone: "9876543210",
        gender: "Male",
        course: course._id,
        department: dept._id,
        semester: 3,
        batch: 2023,
        section: "A",
      })
    );
  }

  // Two attendance marks in Aug 2026: one present, one absent
  await Attendance.create({
    student: students[0]._id,
    course: course._id,
    date: new Date("2026-08-01"),
    period: "1",
    status: "Present",
  });
  await Attendance.create({
    student: students[1]._id,
    course: course._id,
    date: new Date("2026-08-02"),
    period: "1",
    status: "Absent",
  });

  // One fee payment of 30000 in July 2026
  const fee = await Fee.create({
    student: students[0]._id,
    semester: 3,
    items: [{ itemName: "Tuition", amount: 30000 }],
    totalAmount: 30000,
  });
  fee.amountPaid = 30000;
  fee.paymentHistory.push({ amount: 30000, method: "Cash", receiptNumber: "RCP-1" });
  fee.paymentHistory[0].createdAt = new Date("2026-07-15");
  await fee.save();

  // Two results: 80/100 and 20/100 (pass threshold 40%)
  const exam = await Exam.create({
    examName: "Midterm CS201",
    examType: "Midterm",
    course: course._id,
    semester: 3,
    maxMarks: 100,
    status: "Published",
  });
  await Result.create({
    student: students[0]._id,
    exam: exam._id,
    marksObtained: 80,
    maxMarks: 100,
    grade: "A",
  });
  await Result.create({
    student: students[1]._id,
    exam: exam._id,
    marksObtained: 20,
    maxMarks: 100,
    grade: "D",
  });

  return { admin, students, course, dept };
};

test("GET /api/v1/dashboard/analytics — 401 without token", async () => {
  const res = await request(app).get("/api/v1/dashboard/analytics");
  assert.equal(res.status, 401);
});

test("GET /api/v1/dashboard/analytics — 200 with trends and performance", async () => {
  const { admin } = await seedAll();
  const token = generateAccessToken(admin._id);

  const res = await request(app).get("/api/v1/dashboard/analytics").set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const { attendanceTrend, feeTrend, performance, gradeDistribution, studentsByDepartment } = res.body.data;

  assert.equal(attendanceTrend.length, 1);
  assert.equal(attendanceTrend[0].month, "2026-08");
  assert.equal(attendanceTrend[0].present, 1);
  assert.equal(attendanceTrend[0].total, 2);
  assert.equal(attendanceTrend[0].percentage, 50);

  assert.equal(feeTrend.length, 1);
  assert.equal(feeTrend[0].month, "2026-07");
  assert.equal(feeTrend[0].collected, 30000);

  assert.equal(performance.totalResults, 2);
  assert.equal(performance.averagePercentage, 50);
  assert.equal(performance.passRate, 50);

  assert.equal(gradeDistribution.length, 2);
  assert.equal(studentsByDepartment.length, 1);
  assert.equal(studentsByDepartment[0].count, 2);
});

test("GET /api/v1/dashboard/analytics — 200 with empty data", async () => {
  const { admin } = await seedAll();
  const token = generateAccessToken(admin._id);

  await clearDb();
  const freshAdmin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
  });
  const freshToken = generateAccessToken(freshAdmin._id);

  const res = await request(app).get("/api/v1/dashboard/analytics").set(bearer(freshToken));

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.attendanceTrend, []);
  assert.deepEqual(res.body.data.feeTrend, []);
  assert.equal(res.body.data.performance.totalResults, 0);
  assert.equal(res.body.data.performance.passRate, 0);
});
