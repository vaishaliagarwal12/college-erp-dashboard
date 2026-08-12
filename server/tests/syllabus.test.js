const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Department = require("../models/Department");
const Course = require("../models/Course");
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

const seedDepartment = async () =>
  Department.create({
    departmentName: "Computer Science",
    departmentCode: "CS",
    hod: "Dr. A",
  });

const seedCourse = async (department, overrides = {}) =>
  Course.create({
    courseName: "Data Structures",
    courseCode: "CS201",
    department,
    credits: 4,
    semester: 3,
    ...overrides,
  });

const syllabusBody = (courseId, overrides = {}) => ({
  course: String(courseId),
  programOutcomes: ["Solve algorithmic problems"],
  courseOutcomes: ["Implement linked lists"],
  units: [{ title: "Arrays", topics: ["Insertion", "Search"], hours: 10 }],
  textbooks: ["Introduction to Algorithms"],
  recommendedHours: 40,
  ...overrides,
});

test("POST /api/v1/curriculum — 401 without token", async () => {
  const res = await request(app).post("/api/v1/curriculum").send({});

  assert.equal(res.status, 401);
});

test("POST /api/v1/curriculum — 201 creates a syllabus", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);

  const res = await request(app)
    .post("/api/v1/curriculum")
    .set(bearer(generateAccessToken(admin._id)))
    .send(syllabusBody(course._id));

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.course.courseCode, "CS201");
  assert.equal(res.body.data.units[0].title, "Arrays");
});

test("POST /api/v1/curriculum — 400 when the course does not exist", async () => {
  const admin = await seedAdmin();

  const res = await request(app)
    .post("/api/v1/curriculum")
    .set(bearer(generateAccessToken(admin._id)))
    .send(syllabusBody("000000000000000000000000"));

  assert.equal(res.status, 400);
  assert.match(res.body.message, /Course not found/);
});

test("POST /api/v1/curriculum — 409 for a duplicate course", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const token = bearer(generateAccessToken(admin._id));

  await request(app)
    .post("/api/v1/curriculum")
    .set(token)
    .send(syllabusBody(course._id));

  const res = await request(app)
    .post("/api/v1/curriculum")
    .set(token)
    .send(syllabusBody(course._id));

  assert.equal(res.status, 409);
});

test("POST /api/v1/curriculum — 403 for student role", async () => {
  const student = await seedAdmin("Student");
  const department = await seedDepartment();
  const course = await seedCourse(department);

  const res = await request(app)
    .post("/api/v1/curriculum")
    .set(bearer(generateAccessToken(student._id)))
    .send(syllabusBody(course._id));

  assert.equal(res.status, 403);
});

test("GET /api/v1/curriculum — lists with pagination and populated course", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const token = bearer(generateAccessToken(admin._id));

  await request(app).post("/api/v1/curriculum").set(token).send(syllabusBody(course._id));

  const res = await request(app).get("/api/v1/curriculum").set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.data[0].course.courseName, "Data Structures");
  assert.equal(res.body.data[0].course.department.name, "Computer Science");
});

test("GET /api/v1/curriculum/course/:courseId — returns the syllabus for a course", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const token = bearer(generateAccessToken(admin._id));

  await request(app).post("/api/v1/curriculum").set(token).send(syllabusBody(course._id));

  const res = await request(app)
    .get(`/api/v1/curriculum/course/${course._id}`)
    .set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.course.courseCode, "CS201");
});

test("GET /api/v1/curriculum/course/:courseId — 404 when no syllabus exists", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);

  const res = await request(app)
    .get(`/api/v1/curriculum/course/${course._id}`)
    .set(bearer(generateAccessToken(admin._id)));

  assert.equal(res.status, 404);
});

test("PUT /api/v1/curriculum/:id — updates syllabus fields", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const token = bearer(generateAccessToken(admin._id));

  const created = await request(app)
    .post("/api/v1/curriculum")
    .set(token)
    .send(syllabusBody(course._id));

  const res = await request(app)
    .put(`/api/v1/curriculum/${created.body.data.id}`)
    .set(token)
    .send({ recommendedHours: 60, status: "Inactive" });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.recommendedHours, 60);
  assert.equal(res.body.data.status, "Inactive");
});

test("DELETE /api/v1/curriculum/:id — removes the syllabus", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const token = bearer(generateAccessToken(admin._id));

  const created = await request(app)
    .post("/api/v1/curriculum")
    .set(token)
    .send(syllabusBody(course._id));

  const res = await request(app)
    .delete(`/api/v1/curriculum/${created.body.data.id}`)
    .set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});
