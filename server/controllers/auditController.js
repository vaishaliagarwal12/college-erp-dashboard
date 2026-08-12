const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const getAuditLogs = asyncHandler(async (req, res) => {
  const { module, action, search = "" } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};

  if (module) query.module = module;
  if (action) query.action = action;

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    count: logs.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: logs.map((log) => ({
      id: log._id,
      user: log.user
        ? { id: log.user._id, name: log.user.name, email: log.user.email }
        : null,
      module: log.module,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
  });
});

module.exports = { getAuditLogs };
