const express = require("express");
const {
  getDashboardStats,
  getDashboardAnalytics,
} = require("../controllers/dashboardController");
const { protect, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", protect, requirePermission("dashboard", "read"), getDashboardStats);
router.get("/analytics", protect, requirePermission("dashboard", "read"), getDashboardAnalytics);

module.exports = router;
