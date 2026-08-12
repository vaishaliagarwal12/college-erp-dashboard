const mongoose = require("mongoose");
const User = require("../models/User");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const escapeRegex = require("../utils/escapeRegex");
const { ROLES } = require("../config/roles");

const DEFAULT_FACULTY_PASSWORD = "faculty@123";

const USER_FIELDS = "name email";
const DEPARTMENT_FIELDS = "departmentName departmentCode";

const resolveDepartment = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const dept = await Department.findOne({
    $or: [{ departmentCode: value }, { departmentName: value }],
  }).select("_id");
  if (!dept) throw new AppError(`Department not found: ${value}`, 400);
  return dept._id;
};

const serializeFaculty = (faculty) => ({
  id: faculty._id,
  user: faculty.user
    ? { id: faculty.user._id, name: faculty.user.name, email: faculty.user.email }
    : null,
  name: faculty.user?.name || `${faculty.firstName} ${faculty.lastName}`.trim(),
  firstName: faculty.firstName,
  lastName: faculty.lastName,
  employeeId: faculty.employeeId,
  phone: faculty.phone,
  gender: faculty.gender,
  department: faculty.department
    ? {
        id: faculty.department._id,
        name: faculty.department.departmentName,
        code: faculty.department.departmentCode,
      }
    : null,
  designation: faculty.designation,
  qualification: faculty.qualification,
  experience: faculty.experience,
  status: faculty.status,
  createdAt: faculty.createdAt,
  updatedAt: faculty.updatedAt,
});

const POPULATE = [
  { path: "user", select: USER_FIELDS },
  { path: "department", select: DEPARTMENT_FIELDS },
];

const findFullFaculty = (id) => Faculty.findById(id).populate(POPULATE);

// Get All Faculty (search, filter, pagination)
const getFaculty = asyncHandler(async (req, res) => {
  const { search = "", department, status } = req.query;
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
      { employeeId: regex },
    ];
    if (userIds.length) query.$or.push({ user: { $in: userIds } });
  }

  if (department) query.department = await resolveDepartment(department);
  if (status) query.status = status;

  const [total, faculty] = await Promise.all([
    Faculty.countDocuments(query),
    Faculty.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: faculty.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: faculty.map(serializeFaculty),
  });
});

// Get Faculty By ID
const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await findFullFaculty(req.params.id);

  if (!faculty) {
    throw new AppError("Faculty not found", 404);
  }

  res.status(200).json({ success: true, data: serializeFaculty(faculty) });
});

// Create Faculty (creates the linked User account too)
const createFaculty = asyncHandler(async (req, res) => {
  const {
    email,
    password = DEFAULT_FACULTY_PASSWORD,
    firstName,
    lastName,
    department,
    ...profile
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError("User with this email already exists", 409);
  }

  const departmentId = await resolveDepartment(department);

  const user = await User.create({
    name: `${firstName} ${lastName}`.trim(),
    email,
    password,
    role: ROLES.FACULTY,
    status: profile.status === "Inactive" ? "Inactive" : "Active",
  });

  try {
    const faculty = await Faculty.create({
      ...profile,
      user: user._id,
      firstName,
      lastName,
      department: departmentId,
    });

    const full = await findFullFaculty(faculty._id);

    res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      data: serializeFaculty(full),
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

// Update Faculty
const updateFaculty = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.department) updates.department = await resolveDepartment(updates.department);

  const faculty = await Faculty.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!faculty) {
    throw new AppError("Faculty not found", 404);
  }

  if (updates.status) {
    await User.findByIdAndUpdate(faculty.user, { status: updates.status });
  }

  const full = await findFullFaculty(faculty._id);

  res.status(200).json({
    success: true,
    message: "Faculty updated successfully",
    data: serializeFaculty(full),
  });
});

// Delete Faculty (removes the linked User account too)
const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndDelete(req.params.id);

  if (!faculty) {
    throw new AppError("Faculty not found", 404);
  }

  await User.findByIdAndDelete(faculty.user);

  res.status(200).json({
    success: true,
    message: "Faculty deleted successfully",
  });
});

module.exports = {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};
