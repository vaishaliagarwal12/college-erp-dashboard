const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const {
  exportStudents,
  exportFaculty,
  exportFees,
  exportResults,
} = require("../controllers/exportController");

const router = express.Router();

router.use(protect);

router.get("/students", requirePermission("students", "read"), exportStudents);
router.get("/faculty", requirePermission("faculty", "read"), exportFaculty);
router.get("/fees", requirePermission("fees", "read"), exportFees);
router.get("/results", requirePermission("results", "read"), exportResults);

module.exports = router;
