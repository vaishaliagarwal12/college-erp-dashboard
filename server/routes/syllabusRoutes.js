const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getSyllabi,
  getSyllabusById,
  getSyllabusByCourse,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
} = require("../controllers/syllabusController");
const {
  createSyllabusSchema,
  updateSyllabusSchema,
} = require("../validators/syllabusValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getSyllabi);
router.get("/course/:courseId", getSyllabusByCourse);
router.get("/:id", getSyllabusById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("syllabus", "write"),
  validate(createSyllabusSchema),
  audit("syllabus", "create", "Syllabus"),
  createSyllabus
);
router.put(
  "/:id",
  requirePermission("syllabus", "write"),
  validate(updateSyllabusSchema),
  audit("syllabus", "update", "Syllabus"),
  updateSyllabus
);
router.delete(
  "/:id",
  requirePermission("syllabus", "delete"),
  audit("syllabus", "delete", "Syllabus"),
  deleteSyllabus
);

module.exports = router;
