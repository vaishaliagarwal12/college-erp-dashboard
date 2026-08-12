const crypto = require("crypto");
const mongoose = require("mongoose");
const Admission = require("../models/Admission");
const User = require("../models/User");
const Student = require("../models/Student");
const Department = require("../models/Department");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const POPULATE = [
  { path: "course", select: "courseName courseCode" },
  { path: "department", select: "departmentName departmentCode" },
  { path: "appliedBy", select: "name email" },
];

const serializeAdmission = (a) => ({
  id: a._id,
  firstName: a.firstName,
  lastName: a.lastName,
  name: `${a.firstName} ${a.lastName}`.trim(),
  email: a.email,
  phone: a.phone,
  gender: a.gender,
  dateOfBirth: a.dateOfBirth,
  guardianName: a.guardianName,
  guardianPhone: a.guardianPhone,
  address: a.address,
  course: a.course
    ? { id: a.course._id, name: a.course.courseName, code: a.course.courseCode }
    : null,
  department: a.department
    ? { id: a.department._id, name: a.department.departmentName, code: a.department.departmentCode }
    : null,
  semester: a.semester,
  batch: a.batch,
  status: a.status,
  admissionNumber: a.admissionNumber,
  enrolledStudent: a.enrolledStudent,
  remarks: a.remarks,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

const getAdmissions = asyncHandler(async (req, res) => {
  const { status, department, course } = req.query;
  const { page, limit, skip } = getPagination(req.query, 20);

  const query = {};
  if (status) query.status = status;
  if (department && mongoose.isValidObjectId(department)) query.department = department;
  if (course && mongoose.isValidObjectId(course)) query.course = course;

  const [total, admissions] = await Promise.all([
    Admission.countDocuments(query),
    Admission.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: admissions.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: admissions.map(serializeAdmission),
  });
});

const getMyAdmissions = asyncHandler(async (req, res) => {
  const admissions = await Admission.find({ appliedBy: req.user._id })
    .populate(POPULATE)
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: admissions.length, data: admissions.map(serializeAdmission) });
});

const getAdmissionById = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id).populate(POPULATE);
  if (!admission) throw new AppError("Admission application not found", 404);
  res.status(200).json({ success: true, data: serializeAdmission(admission) });
});

const createAdmission = asyncHandler(async (req, res) => {
  const duplicate = await Admission.findOne({ email: req.body.email, status: "Pending" });
  if (duplicate) {
    throw new AppError("An application for this email is already pending", 409);
  }

  const admission = await Admission.create({
    ...req.body,
    appliedBy: req.user._id,
  });

  const full = await Admission.findById(admission._id).populate(POPULATE);

  res.status(201).json({
    success: true,
    message: "Admission application submitted",
    data: serializeAdmission(full),
  });
});

const generateAdmissionNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Admission.countDocuments({
    admissionNumber: { $ne: null },
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  });
  return `ADM-${year}-${String(count + 1).padStart(4, "0")}`;
};

const generateRollNumber = async (department, batch) => {
  const count = await Student.countDocuments({ department: department._id, batch });
  return `${department.departmentCode}${String(batch).slice(-2)}${String(count + 1).padStart(4, "0")}`;
};

const approveAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) throw new AppError("Admission application not found", 404);

  if (admission.status === "Approved") {
    throw new AppError("This application is already approved", 400);
  }
  if (admission.status === "Rejected") {
    throw new AppError("Rejected applications cannot be approved", 400);
  }

  const department = await Department.findById(admission.department);
  if (!department) throw new AppError("Department no longer exists", 400);

  // Create (or reuse) the user account for the applicant
  let user = await User.findOne({ email: admission.email });
  let tempPassword = null;
  if (!user) {
    tempPassword = crypto.randomBytes(9).toString("base64url");
    user = await User.create({
      name: `${admission.firstName} ${admission.lastName}`.trim(),
      email: admission.email,
      password: tempPassword,
      role: "Student",
    });
  }

  const rollNumber = await generateRollNumber(department, admission.batch);

  const student = await Student.create({
    user: user._id,
    firstName: admission.firstName,
    lastName: admission.lastName,
    rollNumber,
    phone: admission.phone,
    gender: admission.gender,
    course: admission.course,
    department: admission.department,
    semester: admission.semester,
    batch: admission.batch,
    section: "A",
    address: admission.address,
  });

  const admissionNumber = await generateAdmissionNumber();

  admission.status = "Approved";
  admission.admissionNumber = admissionNumber;
  admission.enrolledStudent = student._id;
  admission.reviewedBy = req.user._id;
  await admission.save();

  const full = await Admission.findById(admission._id).populate(POPULATE);

  res.status(200).json({
    success: true,
    message: "Admission approved and student enrolled",
    data: {
      ...serializeAdmission(full),
      rollNumber: student.rollNumber,
      tempPassword,
    },
  });
});

const rejectAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) throw new AppError("Admission application not found", 404);

  if (admission.status === "Approved") {
    throw new AppError("Approved applications cannot be rejected", 400);
  }

  admission.status = "Rejected";
  admission.remarks = req.body.remarks || admission.remarks;
  admission.reviewedBy = req.user._id;
  await admission.save();

  const full = await Admission.findById(admission._id).populate(POPULATE);

  res.status(200).json({
    success: true,
    message: "Admission application rejected",
    data: serializeAdmission(full),
  });
});

const deleteAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findByIdAndDelete(req.params.id);
  if (!admission) throw new AppError("Admission application not found", 404);

  res.status(200).json({
    success: true,
    message: "Admission application deleted successfully",
  });
});

module.exports = {
  getAdmissions,
  getMyAdmissions,
  getAdmissionById,
  createAdmission,
  approveAdmission,
  rejectAdmission,
  deleteAdmission,
};
