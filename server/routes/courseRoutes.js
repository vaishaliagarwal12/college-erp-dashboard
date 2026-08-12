const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const {
  createCourseSchema,
  updateCourseSchema,
} = require("../validators/courseValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getCourses);
router.get("/:id", getCourseById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("courses", "write"),
  validate(createCourseSchema),
  audit("courses", "create", "Course"),
  createCourse
);
router.put(
  "/:id",
  requirePermission("courses", "write"),
  validate(updateCourseSchema),
  audit("courses", "update", "Course"),
  updateCourse
);
router.delete(
  "/:id",
  requirePermission("courses", "delete"),
  audit("courses", "delete", "Course"),
  deleteCourse
);

module.exports = router;
