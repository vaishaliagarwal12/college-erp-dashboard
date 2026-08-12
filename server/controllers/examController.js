const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Course = require("../models/Course");
const Result = require("../models/Result");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const COURSE_FIELDS = "courseName courseCode semester";

const POPULATE = [{ path: "course", select: COURSE_FIELDS }];

const resolveCourse = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const course = await Course.findOne({
    $or: [{ courseCode: value }, { courseName: value }],
  }).select("_id");
  if (!course) throw new AppError(`Course not found: ${value}`, 400);
  return course._id;
};

const serializeExam = (exam) => ({
  id: exam._id,
  examName: exam.examName,
  examType: exam.examType,
  course: exam.course
    ? { id: exam.course._id, name: exam.course.courseName, code: exam.course.courseCode }
    : null,
  semester: exam.semester,
  date: exam.date,
  startTime: exam.startTime,
  durationMinutes: exam.durationMinutes,
  maxMarks: exam.maxMarks,
  status: exam.status,
  createdAt: exam.createdAt,
  updatedAt: exam.updatedAt,
});

const findFullExam = (id) => Exam.findById(id).populate(POPULATE);

// Get all exams (search, filter, pagination)
const getExams = asyncHandler(async (req, res) => {
  const { search = "", course, examType, status, semester } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const matchedCourses = await Course.find({
      $or: [{ courseName: regex }, { courseCode: regex }],
    }).select("_id");
    query.$or = [{ examName: regex }];
    if (matchedCourses.length) query.$or.push({ course: { $in: matchedCourses.map((c) => c._id) } });
  }

  if (course) query.course = await resolveCourse(course);
  if (examType) query.examType = examType;
  if (status) query.status = status;
  if (semester) query.semester = Number(semester);

  const [total, exams] = await Promise.all([
    Exam.countDocuments(query),
    Exam.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: exams.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: exams.map(serializeExam),
  });
});

// Get a single exam
const getExamById = asyncHandler(async (req, res) => {
  const exam = await findFullExam(req.params.id);

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  res.status(200).json({ success: true, data: serializeExam(exam) });
});

// Create an exam
const createExam = asyncHandler(async (req, res) => {
  const courseId = await resolveCourse(req.body.course);

  const exam = await Exam.create({
    ...req.body,
    course: courseId,
  });

  const full = await findFullExam(exam._id);

  res.status(201).json({
    success: true,
    message: "Exam created successfully",
    data: serializeExam(full),
  });
});

// Update an exam
const updateExam = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.course) updates.course = await resolveCourse(updates.course);

  const exam = await Exam.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  const full = await findFullExam(exam._id);

  res.status(200).json({
    success: true,
    message: "Exam updated successfully",
    data: serializeExam(full),
  });
});

// Delete an exam (results cascade)
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndDelete(req.params.id);

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  await Result.deleteMany({ exam: exam._id });

  res.status(200).json({
    success: true,
    message: "Exam deleted successfully",
  });
});

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
};
