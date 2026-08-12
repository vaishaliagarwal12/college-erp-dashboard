const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getTimetable,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} = require("../controllers/timetableController");
const {
  createTimetableSchema,
  updateTimetableSchema,
} = require("../validators/timetableValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getTimetable);
router.get("/:id", getTimetableById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("timetable", "write"),
  validate(createTimetableSchema),
  audit("timetable", "create", "Timetable"),
  createTimetable
);
router.put(
  "/:id",
  requirePermission("timetable", "write"),
  validate(updateTimetableSchema),
  audit("timetable", "update", "Timetable"),
  updateTimetable
);
router.delete(
  "/:id",
  requirePermission("timetable", "delete"),
  audit("timetable", "delete", "Timetable"),
  deleteTimetable
);

module.exports = router;
