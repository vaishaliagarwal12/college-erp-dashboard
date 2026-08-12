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

  return { admin, facultyUser, studentUser, student, course, dept };
};

test("Exams: full CRUD flow (admin)", async () => {
  const { admin, course } = await seedData();
  const token = generateAccessToken(admin._id);

  // Create
  const created = await request(app)
    .post("/api/v1/exams")
    .set(bearer(token))
    .send({
      examName: "Midterm 1",
      examType: "Midterm",
      course: "CS201",
      semester: 3,
      date: "2026-09-15",
      startTime: "10:00",
      durationMinutes: 90,
      maxMarks: 50,
    });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.examName, "Midterm 1");
  assert.equal(created.body.data.course.code, "CS201");

  const examId = created.body.data.id;

  // List
  const list = await request(app).get("/api/v1/exams").set(bearer(token));
  assert.equal(list.status, 200);
  assert.equal(list.body.count, 1);

  // Update
  const updated = await request(app)
    .put(`/api/v1/exams/${examId}`)
    .set(bearer(token))
    .send({ maxMarks: 60 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.maxMarks, 60);

  // Delete
  const deleted = await request(app).delete(`/api/v1/exams/${examId}`).set(bearer(token));
  assert.equal(deleted.status, 200);

  const count = await Exam.countDocuments();
  assert.equal(count, 0);
});

test("Exams: faculty can write but cannot delete", async () => {
  const { facultyUser, course } = await seedData();
  const token = generateAccessToken(facultyUser._id);

  const created = await request(app)
    .post("/api/v1/exams")
    .set(bearer(token))
    .send({
      examName: "Midterm 1",
      examType: "Midterm",
      course: "CS201",
      semester: 3,
      maxMarks: 50,
    });

  assert.equal(created.status, 201);

  const deleted = await request(app)
    .delete(`/api/v1/exams/${created.body.data.id}`)
    .set(bearer(token));

  assert.equal(deleted.status, 403);

  const count = await Exam.countDocuments();
  assert.equal(count, 1);
});

test("Results: creating a result auto-computes the grade", async () => {
  const { facultyUser, course } = await seedData();
  const token = generateAccessToken(facultyUser._id);

  const exam = await Exam.create({
    examName: "Final",
    examType: "Final",
    course: course._id,
    semester: 3,
    maxMarks: 100,
  });

  const res = await request(app)
    .post("/api/v1/results")
    .set(bearer(token))
    .send({ student: "CS2023001", exam: String(exam._id), marksObtained: 85 });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.grade, "A");
  assert.equal(res.body.data.percentage, 85);
});

test("Results: 400 when marks exceed max", async () => {
  const { facultyUser, course } = await seedData();
  const token = generateAccessToken(facultyUser._id);

  const exam = await Exam.create({
    examName: "Final",
    examType: "Final",
    course: course._id,
    semester: 3,
    maxMarks: 50,
  });

  const res = await request(app)
    .post("/api/v1/results")
    .set(bearer(token))
    .send({ student: "CS2023001", exam: String(exam._id), marksObtained: 60 });

  assert.equal(res.status, 400);
});

test("Results: transcript computes CGPA across courses", async () => {
  const { facultyUser, student, course } = await seedData();
  const token = generateAccessToken(facultyUser._id);

  const exam = await Exam.create({
    examName: "Final",
    examType: "Final",
    course: course._id,
    semester: 3,
    maxMarks: 100,
  });

  await request(app)
    .post("/api/v1/results")
    .set(bearer(token))
    .send({ student: "CS2023001", exam: String(exam._id), marksObtained: 95 });

  const res = await request(app)
    .get(`/api/v1/results/transcript/${student._id}`)
    .set(bearer(token));

  assert.equal(res.status, 200);
  assert.equal(res.body.data.courses.length, 1);
  assert.equal(res.body.data.courses[0].grade, "A+");
  assert.equal(res.body.data.cgpa, 10);
});

test("Results: 403 for student role", async () => {
  const { studentUser, course } = await seedData();
  const token = generateAccessToken(studentUser._id);

  const exam = await Exam.create({
    examName: "Final",
    examType: "Final",
    course: course._id,
    semester: 3,
    maxMarks: 100,
  });

  const res = await request(app)
    .post("/api/v1/results")
    .set(bearer(token))
    .send({ student: "CS2023001", exam: String(exam._id), marksObtained: 50 });

  assert.equal(res.status, 403);
});
