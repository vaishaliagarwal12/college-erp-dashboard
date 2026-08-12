const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  getStudentTranscript,
} = require("../controllers/resultController");
const {
  createResultSchema,
  updateResultSchema,
} = require("../validators/resultValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getResults);
router.get("/transcript/:studentId", getStudentTranscript);
router.get("/:id", getResultById);

// Write: data-driven permission map
router.post(
  "/",
  requirePermission("results", "write"),
  validate(createResultSchema),
  audit("results", "create", "Result"),
  createResult
);
router.put(
  "/:id",
  requirePermission("results", "write"),
  validate(updateResultSchema),
  audit("results", "update", "Result"),
  updateResult
);
router.delete(
  "/:id",
  requirePermission("results", "delete"),
  audit("results", "delete", "Result"),
  deleteResult
);

module.exports = router;
