const mongoose = require("mongoose");

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "On Leave"];
const PERIODS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    period: {
      type: String,
      enum: PERIODS,
      default: "1",
    },

    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate marking for the same student/course/day/period
attendanceSchema.index(
  { student: 1, course: 1, date: 1, period: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
