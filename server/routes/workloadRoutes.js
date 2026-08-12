const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getWorkloads,
  getWorkloadById,
  createWorkload,
  updateWorkload,
  deleteWorkload,
  getFacultyWorkload,
  getWorkloadSummary,
} = require("../controllers/workloadController");
const {
  createWorkloadSchema,
  updateWorkloadSchema,
} = require("../validators/workloadValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getWorkloads);
router.get("/summary", getWorkloadSummary);
router.get("/faculty/:facultyId", getFacultyWorkload);
router.get("/:id", getWorkloadById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("workload", "write"),
  validate(createWorkloadSchema),
  audit("workload", "create", "FacultyWorkload"),
  createWorkload
);
router.put(
  "/:id",
  requirePermission("workload", "write"),
  validate(updateWorkloadSchema),
  audit("workload", "update", "FacultyWorkload"),
  updateWorkload
);
router.delete(
  "/:id",
  requirePermission("workload", "delete"),
  audit("workload", "delete", "FacultyWorkload"),
  deleteWorkload
);

module.exports = router;
