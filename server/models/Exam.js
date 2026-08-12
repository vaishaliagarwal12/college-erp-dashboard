const mongoose = require("mongoose");

const EXAM_TYPES = ["Quiz", "Midterm", "Final", "Practical", "Assignment"];
const EXAM_STATUSES = ["Scheduled", "Completed", "Published", "Cancelled"];

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: EXAM_TYPES,
      default: "Midterm",
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    semester: {
      type: Number,
      required: true,
      index: true,
    },

    date: {
      type: Date,
      index: true,
    },

    startTime: {
      type: String,
    },

    durationMinutes: {
      type: Number,
      min: 15,
      max: 480,
      default: 60,
    },

    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: EXAM_STATUSES,
      default: "Scheduled",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);
