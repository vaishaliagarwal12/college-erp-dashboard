const FacultyWorkload = require("../models/FacultyWorkload");
const Faculty = require("../models/Faculty");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const config = require("../config");

const POPULATE = [
  {
    path: "faculty",
    select: "firstName lastName employeeId",
  },
  {
    path: "course",
    select: "courseName courseCode credits semester",
  },
  {
    path: "department",
    select: "departmentName",
  },
];

const serializeWorkload = (w) => ({
  id: w._id,
  faculty: w.faculty
    ? {
        id: w.faculty._id,
        name: `${w.faculty.firstName} ${w.faculty.lastName}`.trim(),
        employeeId: w.faculty.employeeId,
      }
    : null,
  course: w.course
    ? {
        id: w.course._id,
        courseName: w.course.courseName,
        courseCode: w.course.courseCode,
        credits: w.course.credits,
        semester: w.course.semester,
      }
    : null,
  department: w.department
    ? { id: w.department._id, name: w.department.departmentName }
    : null,
  semester: w.semester,
  academicYear: w.academicYear,
  section: w.section,
  teachingHoursPerWeek: w.teachingHoursPerWeek,
  role: w.role,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});

const findFullWorkload = (id) =>
  FacultyWorkload.findById(id).populate(POPULATE);

// Sum the weekly hours a faculty already carries in a term; reject overloads
const assertWeeklyCap = async (
  faculty,
  semester,
  academicYear,
  excludeId,
  requestedHours
) => {
  const query = { faculty, semester, academicYear };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await FacultyWorkload.find(query).select("teachingHoursPerWeek");
  const current = existing.reduce((sum, doc) => sum + doc.teachingHoursPerWeek, 0);

  if (current + requestedHours > config.workload.maxWeeklyHours) {
    throw new AppError(
      `Weekly load would exceed the ${config.workload.maxWeeklyHours}-hour cap (currently ${current} hour(s))`,
      400
    );
  }
};

const getWorkloads = asyncHandler(async (req, res) => {
  const { faculty, course, department, semester, academicYear } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};
  if (faculty) query.faculty = faculty;
  if (course) query.course = course;
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  if (academicYear) query.academicYear = academicYear;

  const [total, workloads] = await Promise.all([
    FacultyWorkload.countDocuments(query),
    FacultyWorkload.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: workloads.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: workloads.map(serializeWorkload),
  });
});

const getWorkloadById = asyncHandler(async (req, res) => {
  const workload = await findFullWorkload(req.params.id);
  if (!workload) throw new AppError("Faculty allocation not found", 404);
  res.status(200).json({ success: true, data: serializeWorkload(workload) });
});

const createWorkload = asyncHandler(async (req, res) => {
  const {
    faculty,
    course,
    department,
    semester,
    academicYear,
    section = "A",
    teachingHoursPerWeek,
    role = "Primary",
  } = req.body;

  await assertWeeklyCap(faculty, semester, academicYear, null, teachingHoursPerWeek);

  const workload = await FacultyWorkload.create({
    faculty,
    course,
    department,
    semester,
    academicYear,
    section,
    teachingHoursPerWeek,
    role,
  });

  const full = await findFullWorkload(workload._id);

  res.status(201).json({
    success: true,
    message: "Faculty allocation created successfully",
    data: serializeWorkload(full),
  });
});

const updateWorkload = asyncHandler(async (req, res) => {
  const existing = await FacultyWorkload.findById(req.params.id);
  if (!existing) throw new AppError("Faculty allocation not found", 404);

  const faculty = req.body.faculty || existing.faculty;
  const semester = req.body.semester ?? existing.semester;
  const academicYear = req.body.academicYear || existing.academicYear;
  const requestedHours = req.body.teachingHoursPerWeek ?? existing.teachingHoursPerWeek;

  await assertWeeklyCap(faculty, semester, academicYear, existing._id, requestedHours);

  const updated = await FacultyWorkload.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  const full = await findFullWorkload(updated._id);

  res.status(200).json({
    success: true,
    message: "Faculty allocation updated successfully",
    data: serializeWorkload(full),
  });
});

const deleteWorkload = asyncHandler(async (req, res) => {
  const workload = await FacultyWorkload.findByIdAndDelete(req.params.id);
  if (!workload) throw new AppError("Faculty allocation not found", 404);

  res.status(200).json({
    success: true,
    message: "Faculty allocation deleted successfully",
  });
});

// Per-faculty summary: allocations + total weekly hours + term breakdown
const getFacultyWorkload = asyncHandler(async (req, res) => {
  const allocations = await FacultyWorkload.find({ faculty: req.params.facultyId })
    .populate(POPULATE)
    .sort({ academicYear: 1, semester: 1 });

  const byTerm = {};
  for (const a of allocations) {
    const key = `${a.academicYear} · Sem ${a.semester}`;
    byTerm[key] = (byTerm[key] || 0) + a.teachingHoursPerWeek;
  }

  res.status(200).json({
    success: true,
    data: {
      facultyId: req.params.facultyId,
      totalWeeklyHours: allocations.reduce(
        (sum, a) => sum + a.teachingHoursPerWeek,
        0
      ),
      allocations: allocations.map(serializeWorkload),
      byTerm,
    },
  });
});

// Aggregate report: total load across faculty and terms
const getWorkloadSummary = asyncHandler(async (req, res) => {
  const { academicYear, semester } = req.query;
  const match = {};
  if (academicYear) match.academicYear = academicYear;
  if (semester) match.semester = Number(semester);

  const facultyCollection = Faculty.collection.name;

  const [totalAllocations, byFaculty, byTerm] = await Promise.all([
    FacultyWorkload.countDocuments(match),
    FacultyWorkload.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$faculty",
          totalHours: { $sum: "$teachingHoursPerWeek" },
          allocations: { $sum: 1 },
        },
      },
      { $sort: { totalHours: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: facultyCollection,
          localField: "_id",
          foreignField: "_id",
          as: "f",
        },
      },
      { $unwind: { path: "$f", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalHours: 1,
          allocations: 1,
          name: { $concat: ["$f.firstName", " ", "$f.lastName"] },
          employeeId: "$f.employeeId",
        },
      },
    ]),
    FacultyWorkload.aggregate([
      { $match: match },
      {
        $group: {
          _id: { semester: "$semester", academicYear: "$academicYear" },
          totalHours: { $sum: "$teachingHoursPerWeek" },
          allocations: { $sum: 1 },
        },
      },
      { $sort: { "_id.academicYear": 1, "_id.semester": 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalAllocations,
      totalWeeklyHours: byFaculty.reduce((sum, r) => sum + r.totalHours, 0),
      byFaculty,
      byTerm,
    },
  });
});

module.exports = {
  getWorkloads,
  getWorkloadById,
  createWorkload,
  updateWorkload,
  deleteWorkload,
  getFacultyWorkload,
  getWorkloadSummary,
};
