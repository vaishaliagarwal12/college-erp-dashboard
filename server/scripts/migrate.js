const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config");
const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Course = require("../models/Course");
const Department = require("../models/Department");
const { ROLES } = require("../config/roles");

const APPLY = process.argv.includes("--apply");
const DEFAULT_STUDENT_PASSWORD = "student@123";
const DEFAULT_FACULTY_PASSWORD = "faculty@123";

const report = {
  adminsMigrated: 0,
  adminsSkipped: 0,
  usersCreated: 0,
  studentsLinked: 0,
  studentsSkipped: 0,
  facultyLinked: 0,
  facultySkipped: 0,
  coursesMapped: 0,
  departmentsUnset: 0,
  unmapped: { students: [], faculty: [], courses: [] },
};

const log = (msg) => console.log(`  ${msg}`);

const apply = async (fn) => {
  if (APPLY) await fn();
};

// Create a User doc if it does not exist yet. Returns the id (or null in dry run).
const maybeInsertUser = async ({ name, email, password, role, status }) => {
  if (!email) return null;

  const existing = await User.findOne({ email }).select("_id");
  if (existing) return existing._id;

  const doc = {
    name,
    email,
    password,
    role,
    status: status || "Active",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  };

  if (!APPLY) return null;

  const result = await User.collection.insertOne(doc);
  report.usersCreated++;
  return result.insertedId;
};

// Build lookup: normalized code/name -> _id
const buildLookup = async (Model) => {
  const docs = await Model.find().lean().select("_id departmentCode departmentName courseCode courseName");
  const map = new Map();
  for (const doc of docs) {
    if (doc.departmentCode) map.set(String(doc.departmentCode).toUpperCase(), doc._id);
    if (doc.departmentName) map.set(String(doc.departmentName).toUpperCase(), doc._id);
    if (doc.courseCode) map.set(String(doc.courseCode).toUpperCase(), doc._id);
    if (doc.courseName) map.set(String(doc.courseName).toUpperCase(), doc._id);
  }
  return map;
};

const resolveRef = (value, map) => {
  if (!value) return null;
  if (mongoose.isValidObjectId(String(value))) return value;
  return map.get(String(value).toUpperCase()) || null;
};

const run = async () => {
  console.log(APPLY ? "Applying migration..." : "Dry run — no changes will be made. Re-run with --apply to execute.");

  await mongoose.connect(config.mongoUri);

  const adminColl = mongoose.connection.db.collection("admins");
  const studentColl = mongoose.connection.db.collection("students");
  const facultyColl = mongoose.connection.db.collection("faculty");
  const courseColl = mongoose.connection.db.collection("courses");
  const departmentColl = mongoose.connection.db.collection("departments");

  const deptMap = await buildLookup(Department);
  const courseMap = await buildLookup(Course);

  // 1) Admin -> User (existing bcrypt hashes are preserved verbatim)
  console.log("\n[1/5] Admins -> Users");
  const admins = await adminColl.find().toArray();
  for (const admin of admins) {
    const roleMap = {
      Admin: ROLES.ADMIN,
      Faculty: ROLES.FACULTY,
      Student: ROLES.STUDENT,
    };
    const existing = await User.findOne({ email: admin.email }).select("_id");
    if (existing) {
      report.adminsSkipped++;
      log(`skip ${admin.email} (user already exists)`);
      continue;
    }
    await apply(() =>
      User.collection.insertOne({
        name: admin.name,
        email: admin.email,
        password: admin.password,
        role: roleMap[admin.role] || ROLES.ADMIN,
        status: admin.status || "Active",
        createdAt: admin.createdAt || new Date(),
        updatedAt: admin.updatedAt || new Date(),
        __v: 0,
      })
    );
    report.adminsMigrated++;
    log(`migrated admin ${admin.email}`);
  }

  // 2) Students -> link user + ObjectId refs
  console.log("\n[2/5] Students");
  const students = await studentColl.find().toArray();
  for (const s of students) {
    if (s.user) {
      report.studentsSkipped++;
      continue;
    }
    const updates = {};

    const userId = await maybeInsertUser({
      name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      email: s.email,
      password: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10),
      role: ROLES.STUDENT,
      status: s.status,
    });
    if (userId) updates.user = userId;

    const deptId = resolveRef(s.department, deptMap);
    if (deptId) updates.department = deptId;
    else if (s.department) report.unmapped.students.push(`${s.rollNumber}: department="${s.department}"`);

    const courseId = resolveRef(s.course, courseMap);
    if (courseId) updates.course = courseId;
    else if (s.course) report.unmapped.students.push(`${s.rollNumber}: course="${s.course}"`);

    if (Object.keys(updates).length) {
      report.studentsLinked++;
      await apply(() => studentColl.updateOne({ _id: s._id }, { $set: updates }));
    }
  }

  // 3) Faculty -> link user + ObjectId refs
  console.log("\n[3/5] Faculty");
  const faculty = await facultyColl.find().toArray();
  for (const f of faculty) {
    if (f.user) {
      report.facultySkipped++;
      continue;
    }
    const updates = {};

    const userId = await maybeInsertUser({
      name: `${f.firstName || ""} ${f.lastName || ""}`.trim(),
      email: f.email,
      password: await bcrypt.hash(DEFAULT_FACULTY_PASSWORD, 10),
      role: ROLES.FACULTY,
      status: f.status,
    });
    if (userId) updates.user = userId;

    const deptId = resolveRef(f.department, deptMap);
    if (deptId) updates.department = deptId;
    else if (f.department) report.unmapped.faculty.push(`${f.employeeId}: department="${f.department}"`);

    if (Object.keys(updates).length) {
      report.facultyLinked++;
      await apply(() => facultyColl.updateOne({ _id: f._id }, { $set: updates }));
    }
  }

  // 4) Courses -> department ObjectId ref
  console.log("\n[4/5] Courses");
  const courses = await courseColl.find().toArray();
  for (const c of courses) {
    const deptId = resolveRef(c.department, deptMap);
    if (!deptId) {
      if (c.department) report.unmapped.courses.push(`${c.courseCode}: department="${c.department}"`);
      continue;
    }
    report.coursesMapped++;
    await apply(() => courseColl.updateOne({ _id: c._id }, { $set: { department: deptId } }));
  }

  // 5) Departments -> remove denormalized counters
  console.log("\n[5/5] Departments (drop totalFaculty/totalStudents)");
  const withCounters = await departmentColl
    .find({ $or: [{ totalFaculty: { $exists: true } }, { totalStudents: { $exists: true } }] })
    .toArray();
  report.departmentsUnset = withCounters.length;
  await apply(() =>
    departmentColl.updateMany(
      {},
      { $unset: { totalFaculty: "", totalStudents: "" } }
    )
  );

  console.log("\n===== MIGRATION REPORT =====");
  console.log(JSON.stringify(report, null, 2));

  if (report.unmapped.students.length || report.unmapped.faculty.length || report.unmapped.courses.length) {
    console.log("\n⚠️  Unmapped references (check names/codes):");
    if (report.unmapped.students.length) console.log("  Students:", report.unmapped.students.join("; "));
    if (report.unmapped.faculty.length) console.log("  Faculty:", report.unmapped.faculty.join("; "));
    if (report.unmapped.courses.length) console.log("  Courses:", report.unmapped.courses.join("; "));
  }

  if (!APPLY) {
    console.log("\nDry run finished. Re-run with --apply to make these changes.");
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
