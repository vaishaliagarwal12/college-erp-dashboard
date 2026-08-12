const mongoose = require("mongoose");
const Course = require("../models/Course");
const Department = require("../models/Department");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const escapeRegex = require("../utils/escapeRegex");
const { tenantScope, tenantCreate } = require("../utils/tenantScope");

const DEPARTMENT_FIELDS = "departmentName departmentCode";

const resolveDepartment = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const dept = await Department.findOne({
    $or: [{ departmentCode: value }, { departmentName: value }],
  }).select("_id");
  if (!dept) throw new AppError(`Department not found: ${value}`, 400);
  return dept._id;
};

const serializeCourse = (course) => ({
  id: course._id,
  courseName: course.courseName,
  courseCode: course.courseCode,
  department: course.department
    ? {
        id: course.department._id,
        name: course.department.departmentName,
        code: course.department.departmentCode,
      }
    : null,
  credits: course.credits,
  semester: course.semester,
  description: course.description,
  status: course.status,
  createdAt: course.createdAt,
  updatedAt: course.updatedAt,
});

const POPULATE = [{ path: "department", select: DEPARTMENT_FIELDS }];

// Get All Courses (search, filter, pagination)
const getCourses = asyncHandler(async (req, res) => {
  const { search = "", department, semester, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = { ...tenantScope(req) };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ courseName: regex }, { courseCode: regex }];
  }

  if (department) query.department = await resolveDepartment(department);
  if (semester) query.semester = Number(semester);
  if (status) query.status = status;

  const [total, courses] = await Promise.all([
    Course.countDocuments(query),
    Course.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: courses.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: courses.map(serializeCourse),
  });
});

// Get Course By ID
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, ...tenantScope(req) }).populate(
    POPULATE
  );

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  res.status(200).json({ success: true, data: serializeCourse(course) });
});

// Create Course
const createCourse = asyncHandler(async (req, res) => {
  const { department, ...rest } = req.body;

  const course = await Course.create({
    ...rest,
    ...tenantCreate(req),
    department: await resolveDepartment(department),
  });

  const full = await Course.findById(course._id).populate(POPULATE);

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: serializeCourse(full),
  });
});

// Update Course
const updateCourse = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.department) updates.department = await resolveDepartment(updates.department);

  const course = await Course.findOneAndUpdate(
    { _id: req.params.id, ...tenantScope(req) },
    updates,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const full = await Course.findById(course._id).populate(POPULATE);

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: serializeCourse(full),
  });
});

// Delete Course
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndDelete({ _id: req.params.id, ...tenantScope(req) });

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
