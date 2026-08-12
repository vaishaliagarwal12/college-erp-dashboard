const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    departmentCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
      trim: true,
    },

    hod: {
      type: String,
      required: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ tenantId: 1, departmentName: 1 }, { unique: true });
departmentSchema.index({ tenantId: 1, departmentCode: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
