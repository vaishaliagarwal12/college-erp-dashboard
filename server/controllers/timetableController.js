const mongoose = require("mongoose");
const Timetable = require("../models/Timetable");
const Course = require("../models/Course");
const Department = require("../models/Department");
const Faculty = require("../models/Faculty");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const COURSE_FIELDS = "courseName courseCode";
const DEPARTMENT_FIELDS = "departmentName departmentCode";
const FACULTY_FIELDS = "firstName lastName employeeId";

const POPULATE = [
  { path: "course", select: COURSE_FIELDS },
  { path: "department", select: DEPARTMENT_FIELDS },
  { path: "faculty", select: FACULTY_FIELDS, populate: { path: "user", select: "name" } },
];

const resolveRef = async (Model, value, fields, label) => {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return value;
  const doc = await Model.findOne({ $or: fields.map((f) => ({ [f]: value })) }).select("_id");
  if (!doc) throw new AppError(`${label} not found: ${value}`, 400);
  return doc._id;
};

const resolveCourse = (v) => resolveRef(Course, v, ["courseCode", "courseName"], "Course");
const resolveDepartment = (v) =>
  resolveRef(Department, v, ["departmentCode", "departmentName"], "Department");
const resolveFaculty = (v) =>
  resolveRef(Faculty, v, ["employeeId"], "Faculty");

const serializeTimetable = (slot) => ({
  id: slot._id,
  _id: slot._id,
  day: slot.day || slot.dayOfWeek,
  dayOfWeek: slot.dayOfWeek || slot.day,
  startTime: slot.startTime,
  endTime: slot.endTime,
  course: slot.course
    ? { id: slot.course._id, name: slot.course.courseName, code: slot.course.courseCode }
    : slot.courseName || slot.courseCode || null,
  courseCode: slot.course?.courseCode || slot.courseCode || "",
  courseName: slot.course?.courseName || slot.courseName || "",
  faculty: slot.faculty
    ? {
        id: slot.faculty._id,
        name: slot.faculty.user?.name || `${slot.faculty.firstName} ${slot.faculty.lastName}`.trim(),
        employeeId: slot.faculty.employeeId,
      }
    : slot.facultyName || null,
  facultyName:
    slot.faculty?.user?.name ||
    `${slot.faculty?.firstName || ""} ${slot.faculty?.lastName || ""}`.trim() ||
    slot.facultyName ||
    "",
  department: slot.department
    ? { id: slot.department._id, name: slot.department.departmentName, code: slot.department.departmentCode }
    : slot.departmentName || null,
  departmentName: slot.department?.departmentName || slot.departmentName || "",
  semester: slot.semester,
  section: slot.section,
  room: slot.room,
  createdAt: slot.createdAt,
  updatedAt: slot.updatedAt,
});

const findFullSlot = (id) => Timetable.findById(id).populate(POPULATE);

// Check for scheduling conflicts against other slots
const checkConflicts = async (data, excludeId) => {
  const conflicts = [];
  const dayVal = data.dayOfWeek || data.day;
  const baseQuery = {
    $or: [{ dayOfWeek: dayVal }, { day: dayVal }],
    startTime: { $lt: data.endTime },
    endTime: { $gt: data.startTime },
  };

  if (excludeId) baseQuery._id = { $ne: excludeId };

  if (data.room) {
    const roomClash = await Timetable.findOne({ ...baseQuery, room: data.room }).populate({
      path: "course",
      select: COURSE_FIELDS,
    });
    if (roomClash) {
      conflicts.push(`Room "${data.room}" is already booked ${dayVal} ${roomClash.startTime}-${roomClash.endTime}`);
    }
  }

  if (data.faculty && mongoose.isValidObjectId(data.faculty)) {
    const facultyClash = await Timetable.findOne({ ...baseQuery, faculty: data.faculty }).populate({
      path: "faculty",
      select: FACULTY_FIELDS,
      populate: { path: "user", select: "name" },
    });
    if (facultyClash) {
      const name =
        facultyClash.faculty?.user?.name ||
        `${facultyClash.faculty?.firstName || ""} ${facultyClash.faculty?.lastName || ""}`.trim();
      conflicts.push(`Faculty "${name}" is already scheduled ${dayVal} ${facultyClash.startTime}-${facultyClash.endTime}`);
    }
  }

  if (data.semester && data.section) {
    const sectionQuery = {
      ...baseQuery,
      semester: data.semester,
      section: data.section,
    };
    if (data.department) sectionQuery.department = data.department;

    const sectionClash = await Timetable.findOne(sectionQuery).populate({ path: "course", select: COURSE_FIELDS });
    if (sectionClash) {
      conflicts.push(
        `Section ${data.semester}-${data.section} already has ${sectionClash.course?.courseName || "a class"} ${sectionClash.startTime}-${sectionClash.endTime}`
      );
    }
  }

  return conflicts;
};

// Get all timetable slots (filter, pagination)
const getTimetable = asyncHandler(async (req, res) => {
  const { dayOfWeek, day, course, department, faculty, semester, section } = req.query;
  const { page, limit, skip } = getPagination(req.query, 50);

  const query = {};
  const dayVal = dayOfWeek || day;
  if (dayVal) query.$or = [{ dayOfWeek: dayVal }, { day: dayVal }];
  if (semester) query.semester = Number(semester);
  if (section) query.section = section.toUpperCase();
  if (course) query.course = await resolveCourse(course);
  if (department) query.department = await resolveDepartment(department);
  if (faculty) query.faculty = await resolveFaculty(faculty);

  const [total, slots] = await Promise.all([
    Timetable.countDocuments(query),
    Timetable.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ dayOfWeek: 1, day: 1, startTime: 1 }),
  ]);

  res.status(200).json({
    success: true,
    count: slots.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: slots.map(serializeTimetable),
  });
});

// Get a single slot
const getTimetableById = asyncHandler(async (req, res) => {
  const slot = await findFullSlot(req.params.id);

  if (!slot) {
    throw new AppError("Timetable entry not found", 404);
  }

  res.status(200).json({ success: true, data: serializeTimetable(slot) });
});

// Create a timetable slot (with conflict detection)
const createTimetable = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    dayOfWeek: req.body.dayOfWeek || req.body.day,
    day: req.body.day || req.body.dayOfWeek,
  };

  if (data.course) data.course = await resolveCourse(data.course);
  if (data.department) data.department = await resolveDepartment(data.department);
  if (data.faculty) data.faculty = await resolveFaculty(data.faculty);

  const conflicts = await checkConflicts(data);
  if (conflicts.length) {
    throw new AppError(`Scheduling conflict detected: ${conflicts.join(" | ")}`, 409);
  }

  const slot = await Timetable.create(data);
  const full = await findFullSlot(slot._id);

  res.status(201).json({
    success: true,
    message: "Timetable entry created successfully",
    data: serializeTimetable(full || slot),
  });
});

// Update a timetable slot
const updateTimetable = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.day || data.dayOfWeek) {
    data.dayOfWeek = data.dayOfWeek || data.day;
    data.day = data.day || data.dayOfWeek;
  }

  if (data.course) data.course = await resolveCourse(data.course);
  if (data.department) data.department = await resolveDepartment(data.department);
  if (data.faculty) data.faculty = await resolveFaculty(data.faculty);

  const existing = await Timetable.findById(req.params.id);
  if (!existing) {
    throw new AppError("Timetable entry not found", 404);
  }

  const merged = { ...existing.toObject(), ...data };
  const conflicts = await checkConflicts(merged, req.params.id);
  if (conflicts.length) {
    throw new AppError(`Scheduling conflict detected: ${conflicts.join(" | ")}`, 409);
  }

  const slot = await Timetable.findByIdAndUpdate(req.params.id, data, {
    returnDocument: "after",
    runValidators: true,
  });

  const full = await findFullSlot(slot._id);

  res.status(200).json({
    success: true,
    message: "Timetable entry updated successfully",
    data: serializeTimetable(full || slot),
  });
});

// Delete a timetable slot
const deleteTimetable = asyncHandler(async (req, res) => {
  const slot = await Timetable.findByIdAndDelete(req.params.id);

  if (!slot) {
    throw new AppError("Timetable entry not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Timetable entry deleted successfully",
  });
});

module.exports = {
  getTimetable,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
};
