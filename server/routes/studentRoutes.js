const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const {
  createStudentSchema,
  updateStudentSchema,
} = require("../validators/studentValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getStudents);
router.get("/:id", getStudentById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("students", "write"),
  validate(createStudentSchema),
  audit("students", "create", "Student"),
  createStudent
);
router.put(
  "/:id",
  requirePermission("students", "write"),
  validate(updateStudentSchema),
  audit("students", "update", "Student"),
  updateStudent
);
router.delete(
  "/:id",
  requirePermission("students", "delete"),
  audit("students", "delete", "Student"),
  deleteStudent
);

module.exports = router;
