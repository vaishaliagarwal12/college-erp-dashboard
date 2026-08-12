const mongoose = require("mongoose");
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const Course = require("../models/Course");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const { gradeForPercentage, percentageFromMarks } = require("../utils/grades");

const GRADE_POINTS = {
  "A+": 10,
  A: 9,
  "B+": 8,
  B: 7,
  C: 6,
  D: 5,
  F: 0,
};

const STUDENT_FIELDS = "rollNumber firstName lastName";
const EXAM_FIELDS = "examName examType semester maxMarks date status";
const COURSE_FIELDS = "courseName courseCode credits";

const POPULATE = [
  {
    path: "student",
    select: STUDENT_FIELDS,
    populate: { path: "user", select: "name" },
  },
  { path: "exam", select: EXAM_FIELDS, populate: { path: "course", select: COURSE_FIELDS } },
];

const resolveStudent = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const student = await Student.findOne({ rollNumber: value }).select("_id");
  if (!student) throw new AppError(`Student not found: ${value}`, 400);
  return student._id;
};

const resolveExam = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const exam = await Exam.findOne({ examName: value }).select("_id");
  if (!exam) throw new AppError(`Exam not found: ${value}`, 400);
  return exam._id;
};

const computeGrade = (obtained, max) => gradeForPercentage(percentageFromMarks(obtained, max));

const serializeResult = (result) => ({
  id: result._id,
  student: result.student
    ? {
        id: result.student._id,
        name: result.student.user?.name || `${result.student.firstName} ${result.student.lastName}`.trim(),
        rollNumber: result.student.rollNumber,
      }
    : null,
  exam: result.exam
    ? {
        id: result.exam._id,
        name: result.exam.examName,
        type: result.exam.examType,
        semester: result.exam.semester,
        maxMarks: result.exam.maxMarks,
        date: result.exam.date,
        status: result.exam.status,
        course: result.exam.course
          ? { id: result.exam.course._id, name: result.exam.course.courseName, code: result.exam.course.courseCode, credits: result.exam.course.credits }
          : null,
      }
    : null,
  marksObtained: result.marksObtained,
  maxMarks: result.maxMarks || result.exam?.maxMarks || null,
  grade: result.grade,
  percentage: result.maxMarks
    ? Math.round(percentageFromMarks(result.marksObtained, result.maxMarks) * 100) / 100
    : null,
  remarks: result.remarks,
  createdAt: result.createdAt,
  updatedAt: result.updatedAt,
});

const findFullResult = (id) => Result.findById(id).populate(POPULATE);

// Get all results (filter, pagination)
const getResults = asyncHandler(async (req, res) => {
  const { student, exam, course, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};

  if (student) query.student = await resolveStudent(student);
  if (exam) query.exam = await resolveExam(exam);

  if (course) {
    const courseId = mongoose.isValidObjectId(course)
      ? course
      : (await Course.findOne({ $or: [{ courseCode: course }, { courseName: course }] }).select("_id"))?._id;
    if (!courseId) throw new AppError(`Course not found: ${course}`, 400);
    const examIds = await Exam.find({ course: courseId }).select("_id");
    query.exam = { $in: examIds.map((e) => e._id) };
  }

  const [total, results] = await Promise.all([
    Result.countDocuments(query),
    Result.find(query)
      .populate(POPULATE)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: results.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: results.map(serializeResult),
  });
});

// Get a single result
const getResultById = asyncHandler(async (req, res) => {
  const result = await findFullResult(req.params.id);

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  res.status(200).json({ success: true, data: serializeResult(result) });
});

// Create / record a result
const createResult = asyncHandler(async (req, res) => {
  const studentId = await resolveStudent(req.body.student);
  const examId = await resolveExam(req.body.exam);

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  const maxMarks = req.body.maxMarks || exam.maxMarks;

  if (req.body.marksObtained > maxMarks) {
    throw new AppError(`Marks obtained cannot exceed max marks (${maxMarks})`, 400);
  }

  const result = await Result.create({
    ...req.body,
    student: studentId,
    exam: examId,
    maxMarks,
    grade: computeGrade(req.body.marksObtained, maxMarks),
  });

  const full = await findFullResult(result._id);

  res.status(201).json({
    success: true,
    message: "Result recorded successfully",
    data: serializeResult(full),
  });
});

// Update a result (recomputes the grade)
const updateResult = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.student) updates.student = await resolveStudent(updates.student);
  if (updates.exam) updates.exam = await resolveExam(updates.exam);

  const existing = await Result.findById(req.params.id);
  if (!existing) {
    throw new AppError("Result not found", 404);
  }

  const exam = updates.exam ? await Exam.findById(updates.exam) : await Exam.findById(existing.exam);
  const maxMarks = updates.maxMarks || existing.maxMarks || exam?.maxMarks;

  if (updates.marksObtained > maxMarks) {
    throw new AppError(`Marks obtained cannot exceed max marks (${maxMarks})`, 400);
  }

  const result = await Result.findByIdAndUpdate(
    req.params.id,
    {
      ...updates,
      maxMarks,
      grade: computeGrade(updates.marksObtained ?? existing.marksObtained, maxMarks),
    },
    { returnDocument: "after", runValidators: true }
  );

  const full = await findFullResult(result._id);

  res.status(200).json({
    success: true,
    message: "Result updated successfully",
    data: serializeResult(full),
  });
});

// Delete a result
const deleteResult = asyncHandler(async (req, res) => {
  const result = await Result.findByIdAndDelete(req.params.id);

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Result deleted successfully",
  });
});

// Transcript / grade summary for a single student
const getStudentTranscript = asyncHandler(async (req, res) => {
  const studentId = await resolveStudent(req.params.studentId || req.query.student);

  const results = await Result.find({ student: studentId })
    .populate({
      path: "exam",
      select: EXAM_FIELDS,
      populate: { path: "course", select: COURSE_FIELDS },
    })
    .lean();

  const byCourse = new Map();

  for (const r of results) {
    if (!r.exam?.course) continue;
    const courseId = String(r.exam.course._id);
    if (!byCourse.has(courseId)) {
      byCourse.set(courseId, {
        course: {
          id: r.exam.course._id,
          name: r.exam.course.courseName,
          code: r.exam.course.courseCode,
          credits: r.exam.course.credits,
        },
        exams: [],
      });
    }
    byCourse.get(courseId).exams.push({
      examName: r.exam.examName,
      examType: r.exam.examType,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      grade: r.grade,
      percentage: r.maxMarks
        ? Math.round(percentageFromMarks(r.marksObtained, r.maxMarks) * 100) / 100
        : null,
    });
  }

  const courseRows = [];
  let totalPoints = 0;
  let totalCredits = 0;

  for (const [courseId, row] of byCourse) {
    const maxMarks = row.exams.reduce((sum, e) => sum + (e.maxMarks || 0), 0);
    const obtained = row.exams.reduce((sum, e) => sum + e.marksObtained, 0);
    const percentage = maxMarks ? Math.round((obtained / maxMarks) * 10000) / 100 : 0;
    const grade = gradeForPercentage(percentage);
    const credits = row.course.credits || 0;
    const points = (GRADE_POINTS[grade] ?? 0) * credits;

    totalPoints += points;
    totalCredits += credits;

    courseRows.push({
      course: row.course,
      exams: row.exams,
      totalMarks: obtained,
      totalMaxMarks: maxMarks,
      percentage,
      grade,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      student: studentId,
      courses: courseRows,
      cgpa: totalCredits ? Math.round((totalPoints / totalCredits) * 100) / 100 : null,
    },
  });
});

module.exports = {
  getResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  getStudentTranscript,
};
