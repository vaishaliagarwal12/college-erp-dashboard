const Department = require("../models/Department");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const escapeRegex = require("../utils/escapeRegex");
const { tenantScope, tenantCreate } = require("../utils/tenantScope");

const countMap = (rows) =>
  rows.reduce((acc, row) => {
    acc[String(row._id)] = row.count;
    return acc;
  }, {});

const serializeDepartment = (department, studentCount = 0, facultyCount = 0) => ({
  id: department._id,
  departmentName: department.departmentName,
  departmentCode: department.departmentCode,
  hod: department.hod,
  studentCount,
  facultyCount,
  status: department.status,
  createdAt: department.createdAt,
  updatedAt: department.updatedAt,
});

// Fetch live counts instead of denormalized counters
const getCounts = async (departmentIds) => {
  const ids = departmentIds.map((id) => id);
  const [studentRows, facultyRows] = await Promise.all([
    Student.aggregate([
      { $match: { department: { $in: ids } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
    Faculty.aggregate([
      { $match: { department: { $in: ids } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    students: countMap(studentRows),
    faculty: countMap(facultyRows),
  };
};

// Get All Departments (search, filter, pagination)
const getDepartments = asyncHandler(async (req, res) => {
  const { search = "", status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = { ...tenantScope(req) };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ departmentName: regex }, { departmentCode: regex }, { hod: regex }];
  }

  if (status) query.status = status;

  const [total, departments] = await Promise.all([
    Department.countDocuments(query),
    Department.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
  ]);

  const counts = await getCounts(departments.map((d) => d._id));

  res.status(200).json({
    success: true,
    count: departments.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: departments.map((d) =>
      serializeDepartment(d, counts.students[String(d._id)] || 0, counts.faculty[String(d._id)] || 0)
    ),
  });
});

// Get Department By ID
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: req.params.id, ...tenantScope(req) });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  const counts = await getCounts([department._id]);

  res.status(200).json({
    success: true,
    data: serializeDepartment(
      department,
      counts.students[String(department._id)] || 0,
      counts.faculty[String(department._id)] || 0
    ),
  });
});

// Create Department
const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create({ ...req.body, ...tenantCreate(req) });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    data: serializeDepartment(department),
  });
});

// Update Department
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, ...tenantScope(req) },
    req.body,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    data: serializeDepartment(department),
  });
});

// Delete Department
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndDelete({ _id: req.params.id, ...tenantScope(req) });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
  });
});

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
