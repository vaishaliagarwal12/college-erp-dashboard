const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const audit = require("../middleware/audit");
const { getQueue } = require("../jobs/queue");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect);

// Queue backend status (useful for ops debugging)
router.get("/health", (req, res) => {
  const queue = getQueue();
  res.status(200).json({
    success: true,
    data: { backend: queue.usingRedis ? "redis-bullmq" : "in-memory" },
  });
});

// Enqueue a generic email job
router.post(
  "/email",
  requirePermission("notifications", "write"),
  audit("jobs", "enqueue", "Job"),
  asyncHandler(async (req, res) => {
    const { to, subject, text } = req.body;
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: "to and subject are required",
      });
    }
    const queue = getQueue();
    const job = await queue.add("email", { to, subject, text: text || "" });
    res.status(202).json({
      success: true,
      message: "Email job enqueued",
      data: { backend: queue.usingRedis ? "redis-bullmq" : "in-memory", job },
    });
  })
);

// Enqueue a fee-due reminder job for all students with outstanding balances
router.post(
  "/fee-reminders",
  requirePermission("fees", "write"),
  audit("jobs", "enqueue", "Job"),
  asyncHandler(async (req, res) => {
    const queue = getQueue();
    const data = {
      daysOverdue: Number(req.body.daysOverdue) || 30,
      dryRun: Boolean(req.body.dryRun),
    };
    const job = await queue.add("feeReminder", data);
    res.status(202).json({
      success: true,
      message: "Fee reminder job enqueued",
      data: { backend: queue.usingRedis ? "redis-bullmq" : "in-memory", job },
    });
  })
);

// Enqueue a report generation job (CSV written to server/exports)
router.post(
  "/reports/:type",
  requirePermission("fees", "read"),
  audit("jobs", "enqueue", "Job"),
  asyncHandler(async (req, res) => {
    const queue = getQueue();
    const job = await queue.add("reportGeneration", { type: req.params.type });
    res.status(202).json({
      success: true,
      message: "Report job enqueued",
      data: { backend: queue.usingRedis ? "redis-bullmq" : "in-memory", job },
    });
  })
);

module.exports = router;
