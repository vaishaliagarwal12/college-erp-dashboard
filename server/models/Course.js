const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    courseCode: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
      trim: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      default: null,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    credits: {
      type: Number,
      required: true,
    },

    semester: {
      type: Number,
      required: true,
      index: true,
    },

    instructor: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ tenantId: 1, courseCode: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
