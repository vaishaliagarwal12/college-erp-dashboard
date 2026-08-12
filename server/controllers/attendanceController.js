const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Department = require("../models/Department");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const STUDENT_FIELDS = "rollNumber firstName lastName semester";
const COURSE_FIELDS = "courseName courseCode";
const DEPARTMENT_FIELDS = "departmentName departmentCode";

const POPULATE = [
  { path: "student", select: STUDENT_FIELDS, populate: { path: "user", select: "name" } },
  { path: "course", select: COURSE_FIELDS },
  { path: "markedBy", select: "name" },
];

// Accept an ObjectId or a code/name and return an ObjectId
const resolveRef = async (Model, value, fields, label) => {
  if (mongoose.isValidObjectId(value)) return value;
  const doc = await Model.findOne({ $or: fields.map((f) => ({ [f]: value })) }).select("_id");
  if (!doc) throw new AppError(`${label} not found: ${value}`, 400);
  return doc._id;
};

const resolveStudent = (v) => resolveRef(Student, v, ["rollNumber"], "Student");
const resolveCourse = (v) => resolveRef(Course, v, ["courseCode", "courseName"], "Course");
const resolveDepartment = (v) =>
  resolveRef(Department, v, ["departmentCode", "departmentName"], "Department");

const serializeAttendance = (record) => ({
  id: record._id,
  student: record.student
    ? {
        id: record.student._id,
        name: record.student.user?.name || `${record.student.firstName} ${record.student.lastName}`.trim(),
        rollNumber: record.student.rollNumber,
        semester: record.student.semester,
      }
    : null,
  course: record.course
    ? { id: record.course._id, name: record.course.courseName, code: record.course.courseCode }
    : null,
  date: record.date,
  period: record.period,
  status: record.status,
  remarks: record.remarks,
  markedBy: record.markedBy ? { id: record.markedBy._id, name: record.markedBy.name } : null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const findFullAttendance = (id) => Attendance.findById(id).populate(POPULATE);

// Get all attendance records with filters + pagination
const getAttendance = asyncHandler(async (req, res) => {
  const { student, course, department, dateFrom, dateTo, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};

  if (student) query.student = await resolveStudent(student);
  if (course) query.course = await resolveCourse(course);

  if (department) {
    const deptId = await resolveDepartment(department);
    const students = await Student.find({ department: deptId }).select("_id");
    query.student = { $in: students.map((s) => s._id) };
  }

  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = new Date(dateFrom);
    if (dateTo) query.date.$lte = new Date(dateTo);
  }

  if (status) query.status = status;

  const [total, records] = await Promise.all([
    Attendance.countDocuments(query),
    Attendance.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, period: 1, createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: records.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: records.map(serializeAttendance),
  });
});

// Get a single attendance record
const getAttendanceById = asyncHandler(async (req, res) => {
  const record = await findFullAttendance(req.params.id);

  if (!record) {
    throw new AppError("Attendance record not found", 404);
  }

  res.status(200).json({ success: true, data: serializeAttendance(record) });
});

// Mark a single attendance record
const createAttendance = asyncHandler(async (req, res) => {
  const studentId = await resolveStudent(req.body.student);
  const courseId = await resolveCourse(req.body.course);

  const duplicate = await Attendance.findOne({
    student: studentId,
    course: courseId,
    date: req.body.date,
    period: req.body.period,
  });

  if (duplicate) {
    throw new AppError(
      `Attendance already marked for this student on this period. Record ID: ${duplicate._id}`,
      409
    );
  }

  const record = await Attendance.create({
    ...req.body,
    student: studentId,
    course: courseId,
    markedBy: req.user._id,
  });

  const full = await findFullAttendance(record._id);

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
    data: serializeAttendance(full),
  });
});

// Bulk mark attendance (upsert semantics on student+course+date+period)
const bulkCreateAttendance = asyncHandler(async (req, res) => {
  const records = [];

  for (const item of req.body.records) {
    const studentId = await resolveStudent(item.student);
    const courseId = await resolveCourse(item.course);

    records.push({
      student: studentId,
      course: courseId,
      date: item.date,
      period: item.period,
      status: item.status,
      remarks: item.remarks,
      markedBy: req.user._id,
    });
  }

  const operations = records.map((record) => ({
    updateOne: {
      filter: {
        student: record.student,
        course: record.course,
        date: record.date,
        period: record.period,
      },
      update: { $set: record },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations);

  res.status(201).json({
    success: true,
    message: `${records.length} attendance records saved`,
    data: { count: records.length },
  });
});

// Update an attendance record (e.g. correct a mistake)
const updateAttendance = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.student) updates.student = await resolveStudent(updates.student);
  if (updates.course) updates.course = await resolveCourse(updates.course);

  const record = await Attendance.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!record) {
    throw new AppError("Attendance record not found", 404);
  }

  const full = await findFullAttendance(record._id);

  res.status(200).json({
    success: true,
    message: "Attendance record updated successfully",
    data: serializeAttendance(full),
  });
});

// Delete an attendance record
const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);

  if (!record) {
    throw new AppError("Attendance record not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Attendance record deleted successfully",
  });
});

// Attendance summary — per-student percentage for a course (or all courses)
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { student, course, department, dateFrom, dateTo } = req.query;

  let studentFilter = null;
  if (student) studentFilter = await resolveStudent(student);
  if (department) {
    const deptId = await resolveDepartment(department);
    const students = await Student.find({ department: deptId }).select("_id");
    studentFilter = { $in: students.map((s) => s._id) };
  }

  const match = {};
  if (studentFilter) match.student = studentFilter;
  if (course) match.course = await resolveCourse(course);
  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) match.date.$lte = new Date(dateTo);
  }

  const summary = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$student",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] },
        },
        absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        student: "$_id",
        total: 1,
        present: 1,
        absent: 1,
        late: 1,
        onLeave: 1,
        percentage: {
          $round: [
            {
              $cond: [
                { $eq: ["$total", 0] },
                0,
                { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
              ],
            },
            2,
          ],
        },
      },
    },
    { $sort: { percentage: -1 } },
  ]);

  if (!summary.length) {
    res.status(200).json({ success: true, count: 0, data: [] });
    return;
  }

  const students = await Student.find({ _id: { $in: summary.map((s) => s.student) } })
    .populate({ path: "user", select: "name" })
    .select(STUDENT_FIELDS);

  const studentMap = new Map(students.map((s) => [String(s._id), s]));

  const data = summary.map((s) => {
    const doc = studentMap.get(String(s.student));
    return {
      student: {
        id: s.student,
        name: doc?.user?.name || `${doc?.firstName || ""} ${doc?.lastName || ""}`.trim(),
        rollNumber: doc?.rollNumber,
        semester: doc?.semester,
      },
      total: s.total,
      present: s.present,
      absent: s.absent,
      late: s.late,
      onLeave: s.onLeave,
      percentage: s.percentage,
    };
  });

  res.status(200).json({ success: true, count: data.length, data });
});

module.exports = {
  getAttendance,
  getAttendanceById,
  createAttendance,
  bulkCreateAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary,
};
