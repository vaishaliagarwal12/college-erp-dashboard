const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Faculty = require("../models/Faculty");
const Timetable = require("../models/Timetable");
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

  const facultyUser = await User.create({
    name: "Dr. Faculty",
    email: "faculty@test.com",
    password: "password123",
    role: "Faculty",
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

  const faculty = await Faculty.create({
    user: facultyUser._id,
    firstName: "Dr.",
    lastName: "Faculty",
    employeeId: "FAC001",
    phone: "9876543210",
    gender: "Female",
    department: dept._id,
    designation: "Professor",
    qualification: "PhD",
    experience: 5,
  });

  return { admin, faculty, course, dept };
};

const createSlot = (token, overrides = {}) =>
  request(app)
    .post("/api/v1/timetable")
    .set(bearer(token))
    .send({
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      course: "CS201",
      department: "CS",
      semester: 3,
      section: "A",
      room: "Room 101",
      ...overrides,
    });

test("POST /api/v1/timetable — 201 creates a slot", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const res = await createSlot(token);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.dayOfWeek, "Monday");
  assert.equal(res.body.data.course.code, "CS201");
});

test("POST /api/v1/timetable — 409 for overlapping room", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  await createSlot(token);
  const res = await createSlot(token);

  assert.equal(res.status, 409);
  assert.match(res.body.message, /conflict/i);
});

test("POST /api/v1/timetable — allows non-overlapping slots in the same room", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  await createSlot(token);
  const res = await createSlot(token, { startTime: "11:00", endTime: "12:00" });

  assert.equal(res.status, 201);
});

test("PUT /api/v1/timetable/:id — 409 when update creates a conflict", async () => {
  const { admin, course } = await seedData();
  const token = generateAccessToken(admin._id);

  const first = await createSlot(token);
  await createSlot(token, { startTime: "11:00", endTime: "12:00" });

  const res = await request(app)
    .put(`/api/v1/timetable/${first.body.data.id}`)
    .set(bearer(token))
    .send({ startTime: "11:00", endTime: "12:00" });

  assert.equal(res.status, 409);
});

test("GET /api/v1/timetable — filters by semester", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  await createSlot(token);

  const res = await request(app)
    .get("/api/v1/timetable?semester=3")
    .set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.count, 1);
});

test("DELETE /api/v1/timetable/:id — deletes a slot", async () => {
  const { admin } = await seedData();
  const token = generateAccessToken(admin._id);

  const created = await createSlot(token);

  const res = await request(app)
    .delete(`/api/v1/timetable/${created.body.data.id}`)
    .set(bearer(token));

  assert.equal(res.status, 200);
  const count = await Timetable.countDocuments();
  assert.equal(count, 0);
});
