const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  getAdmissions,
  getMyAdmissions,
  getAdmissionById,
  createAdmission,
  approveAdmission,
  rejectAdmission,
  deleteAdmission,
} = require("../controllers/admissionController");
const {
  createAdmissionSchema,
  rejectAdmissionSchema,
  paramIdSchema,
} = require("../validators/admissionValidator");

const router = express.Router();

router.use(protect);

// Applicants (any logged-in user) may submit or view their own applications
router.post("/", validate(createAdmissionSchema), createAdmission);
router.get("/mine", getMyAdmissions);

// Staff manage the application pipeline
router.get("/", requirePermission("admissions", "read"), getAdmissions);
router.get(
  "/:id",
  requirePermission("admissions", "read"),
  validate(paramIdSchema, "params"),
  getAdmissionById
);
router.post(
  "/:id/approve",
  requirePermission("admissions", "write"),
  validate(paramIdSchema, "params"),
  approveAdmission
);
router.post(
  "/:id/reject",
  requirePermission("admissions", "write"),
  validate(paramIdSchema, "params"),
  validate(rejectAdmissionSchema),
  rejectAdmission
);
router.delete(
  "/:id",
  requirePermission("admissions", "delete"),
  validate(paramIdSchema, "params"),
  deleteAdmission
);

module.exports = router;
