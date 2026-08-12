const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const {
  createDepartmentSchema,
  updateDepartmentSchema,
} = require("../validators/departmentValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getDepartments);
router.get("/:id", getDepartmentById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("departments", "write"),
  validate(createDepartmentSchema),
  audit("departments", "create", "Department"),
  createDepartment
);
router.put(
  "/:id",
  requirePermission("departments", "write"),
  validate(updateDepartmentSchema),
  audit("departments", "update", "Department"),
  updateDepartment
);
router.delete(
  "/:id",
  requirePermission("departments", "delete"),
  audit("departments", "delete", "Department"),
  deleteDepartment
);

module.exports = router;
