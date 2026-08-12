const AuditLog = require("../models/AuditLog");

// Audit middleware: records a write action after the response is sent.
// Usage: router.put("/:id", protect, requirePermission(...), audit("students", "update", "Student"), handler)
const audit = (module, action, targetType) => (req, res, next) => {
  const send = res.json.bind(res);

  res.json = (body) => {
    if (req.user && req.user._id) {
      const targetId = req.params.id || (body && body.data && body.data._id) || null;

      AuditLog.create({
        user: req.user._id,
        module,
        action,
        targetType,
        targetId: targetId ? String(targetId) : null,
        ip: req.ip,
        userAgent: req.get("user-agent") || null,
      }).catch(() => {
        // Never fail the request because auditing failed
      });
    }
    return send(body);
  };

  next();
};

module.exports = audit;
