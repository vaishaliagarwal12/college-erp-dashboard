const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Department = require("../models/Department");
const Course = require("../models/Course");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const escapeRegex = require("../utils/escapeRegex");
const { ROLES } = require("../config/roles");

const DEFAULT_STUDENT_PASSWORD = "student@123";

const USER_FIELDS = "name email";
const COURSE_FIELDS = "courseName courseCode";
const DEPARTMENT_FIELDS = "departmentName departmentCode";

// Accept an ObjectId or a code/name and return a Department ObjectId
const resolveDepartment = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const dept = await Department.findOne({
    $or: [{ departmentCode: value }, { departmentName: value }],
  }).select("_id");
  if (!dept) throw new AppError(`Department not found: ${value}`, 400);
  return dept._id;
};

// Accept an ObjectId or a code/name and return a Course ObjectId
const resolveCourse = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const course = await Course.findOne({
    $or: [{ courseCode: value }, { courseName: value }],
  }).select("_id");
  if (!course) throw new AppError(`Course not found: ${value}`, 400);
  return course._id;
};

const serializeStudent = (student) => ({
  id: student._id,
  user: student.user
    ? { id: student.user._id, name: student.user.name, email: student.user.email }
    : null,
  name: student.user?.name || `${student.firstName} ${student.lastName}`.trim(),
  firstName: student.firstName,
  lastName: student.lastName,
  rollNumber: student.rollNumber,
  phone: student.phone,
  gender: student.gender,
  course: student.course
    ? { id: student.course._id, name: student.course.courseName, code: student.course.courseCode }
    : null,
  department: student.department
    ? {
        id: student.department._id,
        name: student.department.departmentName,
        code: student.department.departmentCode,
      }
    : null,
  semester: student.semester,
  batch: student.batch,
  section: student.section,
  address: student.address,
  status: student.status,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

const POPULATE = [
  { path: "user", select: USER_FIELDS },
  { path: "course", select: COURSE_FIELDS },
  { path: "department", select: DEPARTMENT_FIELDS },
];

const findFullStudent = (id) => Student.findById(id).populate(POPULATE);

// Get All Students (search, filter, pagination)
const getStudents = asyncHandler(async (req, res) => {
  const { search = "", department, course, semester, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const matchedUsers = await User.find({
      $or: [{ name: regex }, { email: regex }],
    }).select("_id");
    const userIds = matchedUsers.map((u) => u._id);

    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { rollNumber: regex },
    ];
    if (userIds.length) query.$or.push({ user: { $in: userIds } });
  }

  if (department) query.department = await resolveDepartment(department);
  if (course) query.course = await resolveCourse(course);
  if (semester) query.semester = Number(semester);
  if (status) query.status = status;

  const [total, students] = await Promise.all([
    Student.countDocuments(query),
    Student.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: students.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: students.map(serializeStudent),
  });
});

// Get Student By ID
const getStudentById = asyncHandler(async (req, res) => {
  const student = await findFullStudent(req.params.id);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  res.status(200).json({ success: true, data: serializeStudent(student) });
});

// Create Student (creates the linked User account too)
const createStudent = asyncHandler(async (req, res) => {
  const {
    email,
    password = DEFAULT_STUDENT_PASSWORD,
    firstName,
    lastName,
    department,
    course,
    ...profile
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError("User with this email already exists", 409);
  }

  const departmentId = await resolveDepartment(department);
  const courseId = await resolveCourse(course);

  const user = await User.create({
    name: `${firstName} ${lastName}`.trim(),
    email,
    password,
    role: ROLES.STUDENT,
    status: profile.status === "Inactive" ? "Inactive" : "Active",
  });

  try {
    const student = await Student.create({
      ...profile,
      user: user._id,
      firstName,
      lastName,
      department: departmentId,
      course: courseId,
    });

    const full = await findFullStudent(student._id);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: serializeStudent(full),
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

// Update Student
const updateStudent = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.department) updates.department = await resolveDepartment(updates.department);
  if (updates.course) updates.course = await resolveCourse(updates.course);

  const student = await Student.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (updates.status) {
    await User.findByIdAndUpdate(student.user, { status: updates.status });
  }

  const full = await findFullStudent(student._id);

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: serializeStudent(full),
  });
});

// Delete Student (removes the linked User account too)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  await User.findByIdAndDelete(student.user);

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
  });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
