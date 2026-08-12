const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} = require("../controllers/examController");
const {
  createExamSchema,
  updateExamSchema,
} = require("../validators/examValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getExams);
router.get("/:id", getExamById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("exams", "write"),
  validate(createExamSchema),
  audit("exams", "create", "Exam"),
  createExam
);
router.put(
  "/:id",
  requirePermission("exams", "write"),
  validate(updateExamSchema),
  audit("exams", "update", "Exam"),
  updateExam
);
router.delete(
  "/:id",
  requirePermission("exams", "delete"),
  audit("exams", "delete", "Exam"),
  deleteExam
);

module.exports = router;
