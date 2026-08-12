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

const seedFaculty = async (department) => {
  const user = await User.create({
    name: "Prof X",
    email: "faculty@test.com",
    password: "password123",
    role: "Faculty",
  });
  return Faculty.create({
    user: user._id,
    firstName: "Prof",
    lastName: "X",
    employeeId: "EMP001",
    phone: "9876543210",
    gender: "Male",
    department,
    designation: "Associate Professor",
    qualification: "PhD",
    experience: 8,
  });
};

const allocBody = (faculty, course, department, overrides = {}) => ({
  faculty: String(faculty._id),
  course: String(course._id),
  department: String(department._id),
  semester: 3,
  academicYear: "2026-2027",
  section: "A",
  teachingHoursPerWeek: 6,
  role: "Primary",
  ...overrides,
});

test("POST /api/v1/workload — 401 without token", async () => {
  const res = await request(app).post("/api/v1/workload").send({});

  assert.equal(res.status, 401);
});

test("POST /api/v1/workload — 201 creates an allocation", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);

  const res = await request(app)
    .post("/api/v1/workload")
    .set(bearer(generateAccessToken(admin._id)))
    .send(allocBody(faculty, course, department));

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.faculty.name, "Prof X");
  assert.equal(res.body.data.course.courseCode, "CS201");
  assert.equal(res.body.data.teachingHoursPerWeek, 6);
});

test("POST /api/v1/workload — 409 for a duplicate allocation", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);
  const token = bearer(generateAccessToken(admin._id));

  const body = allocBody(faculty, course, department);
  await request(app).post("/api/v1/workload").set(token).send(body);

  const res = await request(app).post("/api/v1/workload").set(token).send(body);

  assert.equal(res.status, 409);
});

test("POST /api/v1/workload — 400 when the weekly-hour cap is exceeded", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const faculty = await seedFaculty(department);
  const courseA = await seedCourse(department);
  const courseB = await seedCourse(department, { courseCode: "CS202", courseName: "Algorithms" });
  const courseC = await seedCourse(department, { courseCode: "CS203", courseName: "DBMS" });
  const token = bearer(generateAccessToken(admin._id));

  // Cap is 12h/week in the test env: two 6h allocations fill it
  await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, courseA, department));
  await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, courseB, department));

  const res = await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, courseC, department));

  assert.equal(res.status, 400);
  assert.match(res.body.message, /cap/i);
});

test("POST /api/v1/workload — 403 for student role", async () => {
  const student = await seedAdmin("Student");
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);

  const res = await request(app)
    .post("/api/v1/workload")
    .set(bearer(generateAccessToken(student._id)))
    .send(allocBody(faculty, course, department));

  assert.equal(res.status, 403);
});

test("GET /api/v1/workload — lists allocations with populated refs", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);
  const token = bearer(generateAccessToken(admin._id));

  await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, course, department));

  const res = await request(app).get("/api/v1/workload").set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.pagination.total, 1);
  assert.equal(res.body.data[0].faculty.employeeId, "EMP001");
  assert.equal(res.body.data[0].department.name, "Computer Science");
});

test("GET /api/v1/workload/faculty/:facultyId — returns a per-faculty summary", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);
  const token = bearer(generateAccessToken(admin._id));

  await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, course, department));

  const res = await request(app)
    .get(`/api/v1/workload/faculty/${faculty._id}`)
    .set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalWeeklyHours, 6);
  assert.equal(res.body.data.allocations.length, 1);
  assert.equal(res.body.data.byTerm["2026-2027 · Sem 3"], 6);
});

test("GET /api/v1/workload/summary — aggregates hours across faculty and terms", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);
  const token = bearer(generateAccessToken(admin._id));

  await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, course, department));

  const res = await request(app).get("/api/v1/workload/summary").set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalAllocations, 1);
  assert.equal(res.body.data.totalWeeklyHours, 6);
  assert.equal(res.body.data.byFaculty.length, 1);
  assert.equal(res.body.data.byFaculty[0].name, "Prof X");
  assert.equal(res.body.data.byTerm[0].totalHours, 6);
});

test("PUT /api/v1/workload/:id — updates an allocation", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);
  const token = bearer(generateAccessToken(admin._id));

  const created = await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, course, department));

  const res = await request(app)
    .put(`/api/v1/workload/${created.body.data.id}`)
    .set(token)
    .send({ teachingHoursPerWeek: 4 });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.teachingHoursPerWeek, 4);
});

test("DELETE /api/v1/workload/:id — removes an allocation", async () => {
  const admin = await seedAdmin();
  const department = await seedDepartment();
  const course = await seedCourse(department);
  const faculty = await seedFaculty(department);
  const token = bearer(generateAccessToken(admin._id));

  const created = await request(app)
    .post("/api/v1/workload")
    .set(token)
    .send(allocBody(faculty, course, department));

  const res = await request(app)
    .delete(`/api/v1/workload/${created.body.data.id}`)
    .set(token);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});
