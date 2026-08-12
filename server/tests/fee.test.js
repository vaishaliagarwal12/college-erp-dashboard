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

const validFeeBody = {
  student: "CS2023001",
  semester: 3,
  items: [
    { itemName: "Tuition Fee", amount: 50000 },
    { itemName: "Lab Fee", amount: 10000 },
  ],
  dueDate: "2026-12-31T00:00:00.000Z",
};

test("GET /api/v1/fees — 401 without token", async () => {
  const res = await request(app).get("/api/v1/fees");
  assert.equal(res.status, 401);
});

test("POST /api/v1/fees — 201 creates fee with computed total", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const res = await request(app)
    .post("/api/v1/fees")
    .set(bearer(token))
    .send(validFeeBody);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.totalAmount, 60000);
  assert.equal(res.body.data.status, "Unpaid");
  assert.equal(res.body.data.student.rollNumber, "CS2023001");
});

test("POST /api/v1/fees — 409 for duplicate student/semester", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);
  const res = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);

  assert.equal(res.status, 409);
});

test("POST /api/v1/fees — 403 for student role", async () => {
  const { student } = await seedData();
  const studentUser = await User.findById(student.user);
  const token = generateAccessToken(studentUser._id);

  const res = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);

  assert.equal(res.status, 403);
});

test("POST /api/v1/fees/:id/pay — 200 records payment and updates balance", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);

  const res = await request(app)
    .post(`/api/v1/fees/${created.body.data.id}/pay`)
    .set(bearer(token))
    .send({ amount: 25000, method: "UPI", reference: "UPI-123" });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.amountPaid, 25000);
  assert.equal(res.body.data.balance, 35000);
  assert.equal(res.body.data.status, "Partially Paid");
  assert.ok(res.body.data.receipt.receiptNumber);
});

test("POST /api/v1/fees/:id/pay — 400 when payment exceeds balance", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);

  const res = await request(app)
    .post(`/api/v1/fees/${created.body.data.id}/pay`)
    .set(bearer(token))
    .send({ amount: 70000, method: "Cash" });

  assert.equal(res.status, 400);
});

test("GET /api/v1/fees/summary — returns financial totals", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);
  await request(app)
    .post(`/api/v1/fees/${created.body.data.id}/pay`)
    .set(bearer(token))
    .send({ amount: 60000, method: "Bank Transfer" });

  const res = await request(app).get("/api/v1/fees/summary").set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalCollected, 60000);
  assert.equal(res.body.data.totalOutstanding, 0);
});

test("GET /api/v1/fees — filters by status", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);
  await request(app)
    .post(`/api/v1/fees/${created.body.data.id}/pay`)
    .set(bearer(token))
    .send({ amount: 60000, method: "Cash" });

  const res = await request(app).get("/api/v1/fees?status=Paid").set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.data[0].status, "Paid");
});

test("DELETE /api/v1/fees/:id — deletes a fee record", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await request(app).post("/api/v1/fees").set(bearer(token)).send(validFeeBody);

  const res = await request(app)
    .delete(`/api/v1/fees/${created.body.data.id}`)
    .set(bearer(token));

  assert.equal(res.status, 200);
  const count = await Fee.countDocuments();
  assert.equal(count, 0);
});
