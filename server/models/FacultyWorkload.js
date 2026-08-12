const mongoose = require("mongoose");

const workloadSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
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
      index: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "A",
    },

    teachingHoursPerWeek: {
      type: Number,
      required: true,
      min: 1,
    },

    role: {
      type: String,
      enum: ["Primary", "Coordinator", "Lab"],
      default: "Primary",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent assigning the same faculty to the same course/section twice per term
workloadSchema.index(
  { faculty: 1, course: 1, semester: 1, academicYear: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model("FacultyWorkload", workloadSchema);
