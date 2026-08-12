const Syllabus = require("../models/Syllabus");
const Course = require("../models/Course");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const POPULATE = {
  path: "course",
  select: "courseName courseCode credits semester department",
  populate: { path: "department", select: "departmentName" },
};

const serializeSyllabus = (s) => ({
  id: s._id,
  course: s.course
    ? {
        id: s.course._id,
        courseName: s.course.courseName,
        courseCode: s.course.courseCode,
        credits: s.course.credits,
        semester: s.course.semester,
        department: s.course.department
          ? { id: s.course.department._id, name: s.course.department.departmentName }
          : null,
      }
    : null,
  programOutcomes: s.programOutcomes,
  courseOutcomes: s.courseOutcomes,
  units: s.units,
  textbooks: s.textbooks,
  recommendedHours: s.recommendedHours,
  status: s.status,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

const findFullSyllabus = (id) => Syllabus.findById(id).populate(POPULATE);

const getSyllabi = asyncHandler(async (req, res) => {
  const { course, department, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};
  if (course) query.course = course;
  if (status) query.status = status;

  const [total, syllabi] = await Promise.all([
    Syllabus.countDocuments(query),
    Syllabus.find(query).populate(POPULATE).skip(skip).limit(limit).sort({ updatedAt: -1 }),
  ]);

  // Department filtering happens post-populate (course is the owner)
  let data = syllabi.map(serializeSyllabus);
  if (department) {
    data = data.filter((s) => s.course && String(s.course.department?.id) === department);
  }

  res.status(200).json({
    success: true,
    count: data.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data,
  });
});

const getSyllabusById = asyncHandler(async (req, res) => {
  const syllabus = await findFullSyllabus(req.params.id);
  if (!syllabus) throw new AppError("Syllabus not found", 404);
  res.status(200).json({ success: true, data: serializeSyllabus(syllabus) });
});

const getSyllabusByCourse = asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findOne({ course: req.params.courseId }).populate(
    POPULATE
  );
  if (!syllabus) throw new AppError("Syllabus not found for this course", 404);
  res.status(200).json({ success: true, data: serializeSyllabus(syllabus) });
});

const createSyllabus = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.body.course);
  if (!course) throw new AppError("Course not found", 400);

  const syllabus = await Syllabus.create(req.body);
  const full = await findFullSyllabus(syllabus._id);

  res.status(201).json({
    success: true,
    message: "Syllabus created successfully",
    data: serializeSyllabus(full),
  });
});

const updateSyllabus = asyncHandler(async (req, res) => {
  if (req.body.course) {
    const course = await Course.findById(req.body.course);
    if (!course) throw new AppError("Course not found", 400);
  }

  const syllabus = await Syllabus.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!syllabus) throw new AppError("Syllabus not found", 404);

  const full = await findFullSyllabus(syllabus._id);

  res.status(200).json({
    success: true,
    message: "Syllabus updated successfully",
    data: serializeSyllabus(full),
  });
});

const deleteSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findByIdAndDelete(req.params.id);
  if (!syllabus) throw new AppError("Syllabus not found", 404);

  res.status(200).json({
    success: true,
    message: "Syllabus deleted successfully",
  });
});

module.exports = {
  getSyllabi,
  getSyllabusById,
  getSyllabusByCourse,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
};
