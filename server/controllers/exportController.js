const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Fee = require("../models/Fee");
const Result = require("../models/Result");
const asyncHandler = require("../utils/asyncHandler");
const { sendCSV } = require("../utils/export");

const exportStudents = asyncHandler(async (req, res) => {
  const students = await Student.find()
    .populate("user", "name email")
    .populate("course", "courseName courseCode")
    .populate("department", "departmentName departmentCode")
    .lean();

  sendCSV(
    res,
    "students.csv",
    ["rollNumber", "firstName", "lastName", "email", "phone", "gender", "course", "department", "semester", "batch", "section", "status"],
    students.map((s) => ({
      rollNumber: s.rollNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.user?.email || "",
      phone: s.phone,
      gender: s.gender,
      course: s.course?.courseName || "",
      department: s.department?.departmentName || "",
      semester: s.semester,
      batch: s.batch,
      section: s.section,
      status: s.status,
    }))
  );
});

const exportFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.find()
    .populate("user", "name email")
    .populate("department", "departmentName departmentCode")
    .lean();

  sendCSV(
    res,
    "faculty.csv",
    ["employeeId", "firstName", "lastName", "email", "phone", "gender", "department", "designation", "qualification", "experience", "status"],
    faculty.map((f) => ({
      employeeId: f.employeeId,
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.user?.email || "",
      phone: f.phone,
      gender: f.gender,
      department: f.department?.departmentName || "",
      designation: f.designation,
      qualification: f.qualification,
      experience: f.experience,
      status: f.status,
    }))
  );
});

const exportFees = asyncHandler(async (req, res) => {
  const fees = await Fee.find()
    .populate({
      path: "student",
      select: "firstName lastName rollNumber",
      populate: { path: "user", select: "name" },
    })
    .lean();

  sendCSV(
    res,
    "fees.csv",
    ["student", "rollNumber", "semester", "totalAmount", "amountPaid", "balance", "status", "dueDate", "createdAt"],
    fees.map((f) => ({
      student: f.student?.user?.name || `${f.student?.firstName || ""} ${f.student?.lastName || ""}`.trim(),
      rollNumber: f.student?.rollNumber || "",
      semester: f.semester,
      totalAmount: f.totalAmount,
      amountPaid: f.amountPaid,
      balance: f.totalAmount - f.amountPaid,
      status: f.status,
      dueDate: f.dueDate ? new Date(f.dueDate).toISOString().slice(0, 10) : "",
      createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : "",
    }))
  );
});

const exportResults = asyncHandler(async (req, res) => {
  const results = await Result.find()
    .populate({
      path: "student",
      select: "firstName lastName rollNumber",
      populate: { path: "user", select: "name" },
    })
    .populate({ path: "exam", select: "examName examType semester", populate: { path: "course", select: "courseName courseCode" } })
    .lean();

  sendCSV(
    res,
    "results.csv",
    ["student", "rollNumber", "exam", "course", "semester", "marksObtained", "maxMarks", "grade", "remarks"],
    results.map((r) => ({
      student: r.student?.user?.name || `${r.student?.firstName || ""} ${r.student?.lastName || ""}`.trim(),
      rollNumber: r.student?.rollNumber || "",
      exam: r.exam?.examName || "",
      course: r.exam?.course?.courseName || "",
      semester: r.exam?.semester || "",
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks || "",
      grade: r.grade || "",
      remarks: r.remarks || "",
    }))
  );
});

module.exports = {
  exportStudents,
  exportFaculty,
  exportFees,
  exportResults,
};
