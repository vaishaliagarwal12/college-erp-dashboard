const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getAttendance,
  getAttendanceById,
  createAttendance,
  bulkCreateAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary,
} = require("../controllers/attendanceController");
const {
  createAttendanceSchema,
  updateAttendanceSchema,
  bulkAttendanceSchema,
} = require("../validators/attendanceValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getAttendance);
router.get("/summary", getAttendanceSummary);
router.get("/:id", getAttendanceById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("attendance", "write"),
  validate(createAttendanceSchema),
  audit("attendance", "create", "Attendance"),
  createAttendance
);
router.post(
  "/bulk",
  requirePermission("attendance", "write"),
  validate(bulkAttendanceSchema),
  audit("attendance", "create", "Attendance"),
  bulkCreateAttendance
);
router.put(
  "/:id",
  requirePermission("attendance", "write"),
  validate(updateAttendanceSchema),
  audit("attendance", "update", "Attendance"),
  updateAttendance
);
router.delete(
  "/:id",
  requirePermission("attendance", "delete"),
  audit("attendance", "delete", "Attendance"),
  deleteAttendance
);

module.exports = router;
