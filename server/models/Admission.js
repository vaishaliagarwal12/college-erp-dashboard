const mongoose = require("mongoose");

const ADMISSION_STATUSES = ["Pending", "Approved", "Rejected"];

const admissionSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
    },

    guardianName: {
      type: String,
      trim: true,
      default: "",
    },

    guardianPhone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    batch: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ADMISSION_STATUSES,
      default: "Pending",
      index: true,
    },

    admissionNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    enrolledStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

admissionSchema.index({ email: 1, status: 1 });
admissionSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model("Admission", admissionSchema);
module.exports.ADMISSION_STATUSES = ADMISSION_STATUSES;
