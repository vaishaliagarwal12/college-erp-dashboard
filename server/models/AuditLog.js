const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    module: {
      type: String,
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
    },

    targetType: {
      type: String,
    },

    targetId: {
      type: String,
    },

    ip: {
      type: String,
    },

    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
