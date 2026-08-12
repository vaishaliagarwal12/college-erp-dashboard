const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const { getAuditLogs } = require("../controllers/auditController");

const router = express.Router();

router.use(protect);

router.get("/", requirePermission("audit", "read"), getAuditLogs);

module.exports = router;
