const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require("../controllers/facultyController");
const {
  createFacultySchema,
  updateFacultySchema,
} = require("../validators/facultyValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getFaculty);
router.get("/:id", getFacultyById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("faculty", "write"),
  validate(createFacultySchema),
  audit("faculty", "create", "Faculty"),
  createFaculty
);
router.put(
  "/:id",
  requirePermission("faculty", "write"),
  validate(updateFacultySchema),
  audit("faculty", "update", "Faculty"),
  updateFaculty
);
router.delete(
  "/:id",
  requirePermission("faculty", "delete"),
  audit("faculty", "delete", "Faculty"),
  deleteFaculty
);

module.exports = router;
