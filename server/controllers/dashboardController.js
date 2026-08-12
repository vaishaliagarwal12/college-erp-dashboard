const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Result = require("../models/Result");
const asyncHandler = require("../utils/asyncHandler");
const cache = require("../utils/cache");

const statsCacheKey = (req) => `dashboard:stats:${req.tenantId || "single"}`;
const analyticsCacheKey = (req) => `dashboard:analytics:${req.tenantId || "single"}`;

const round = (n, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
};

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const cached = await cache.get(analyticsCacheKey(req));
  if (cached) {
    return res.status(200).json({ success: true, data: cached, cached: true });
  }

  const [attendanceTrend, feeTrend, performance, gradeDist, studentsByDepartment] =
    await Promise.all([
      Attendance.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
            present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Fee.aggregate([
        { $unwind: "$paymentHistory" },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$paymentHistory.createdAt" } },
            collected: { $sum: "$paymentHistory.amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Result.aggregate([
        {
          $project: {
            pct: {
              $cond: [
                { $and: [{ $gt: ["$maxMarks", 0] }, { $ne: ["$maxMarks", null] }] },
                { $multiply: [{ $divide: ["$marksObtained", "$maxMarks"] }, 100] },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            averagePercentage: { $avg: "$pct" },
            passed: { $sum: { $cond: [{ $gte: ["$pct", 40] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]),
      Result.aggregate([
        { $group: { _id: "$grade", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Student.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  const perf = performance[0];
  const passRate = perf && perf.total > 0 ? round((perf.passed / perf.total) * 100) : 0;

  const payload = {
    attendanceTrend: attendanceTrend.map((row) => ({
      month: row._id,
      present: row.present,
      total: row.total,
      percentage: round((row.present / row.total) * 100),
    })),
    feeTrend: feeTrend.map((row) => ({
      month: row._id,
      collected: row.collected,
    })),
    performance: {
      averagePercentage: round(perf?.averagePercentage || 0),
      passRate,
      totalResults: perf?.total || 0,
    },
    gradeDistribution: gradeDist.map((row) => ({ grade: row._id || "N/A", count: row.count })),
    studentsByDepartment: studentsByDepartment.map((row) => ({
      department: row._id,
      count: row.count,
    })),
  };

  await cache.set(analyticsCacheKey(req), payload, 300);

  res.status(200).json({ success: true, data: payload });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const cached = await cache.get(statsCacheKey(req));
  if (cached) {
    return res.status(200).json({ success: true, data: cached, cached: true });
  }

  const [studentFacet, facultyFacet, totalDepartments, totalCourses] =
    await Promise.all([
      Student.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            byDepartment: [
              { $group: { _id: "$department", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            bySemester: [
              { $group: { _id: "$semester", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      Faculty.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            byDesignation: [
              { $group: { _id: "$designation", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ]),
      Department.countDocuments(),
      Course.countDocuments(),
    ]);

  const student = studentFacet[0] || {};
  const faculty = facultyFacet[0] || {};

  const payload = {
    totalStudents: (student.total[0] && student.total[0].count) || 0,
    totalFaculty: (faculty.total[0] && faculty.total[0].count) || 0,
    totalDepartments,
    totalCourses,
    studentsByDepartment: student.byDepartment || [],
    studentsBySemester: student.bySemester || [],
    facultyByDesignation: faculty.byDesignation || [],
  };

  await cache.set(statsCacheKey(req), payload, 60);

  res.status(200).json({ success: true, data: payload });
});

module.exports = {
  getDashboardStats,
  getDashboardAnalytics,
};
