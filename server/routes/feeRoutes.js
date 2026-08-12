const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  recordPayment,
  getFeeSummary,
  deleteFee,
} = require("../controllers/feeController");
const {
  createFeeSchema,
  updateFeeSchema,
  recordPaymentSchema,
  paramIdSchema,
} = require("../validators/feeValidator");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", getFees);
router.get("/summary", getFeeSummary);
router.get("/:id", getFeeById);

// Write / delete: data-driven permission map
router.post("/", requirePermission("fees", "write"), validate(createFeeSchema), createFee);
router.post(
  "/:id/pay",
  requirePermission("fees", "write"),
  validate(recordPaymentSchema),
  recordPayment
);
router.put(
  "/:id",
  requirePermission("fees", "write"),
  validate(updateFeeSchema),
  updateFee
);
router.delete("/:id", requirePermission("fees", "delete"), deleteFee);

module.exports = router;
