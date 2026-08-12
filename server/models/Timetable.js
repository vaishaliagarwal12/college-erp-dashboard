const mongoose = require("mongoose");

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timetableSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: DAYS,
      index: true,
    },

    day: {
      type: String,
      enum: DAYS,
    },

    startTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },

    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    courseName: {
      type: String,
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      index: true,
    },

    facultyName: {
      type: String,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },

    departmentName: {
      type: String,
    },

    semester: {
      type: Number,
      required: true,
      index: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "A",
    },

    room: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtuals / hooks to keep day / dayOfWeek in sync
timetableSchema.pre("save", function () {
  if (this.dayOfWeek && !this.day) this.day = this.dayOfWeek;
  if (this.day && !this.dayOfWeek) this.dayOfWeek = this.day;
});

module.exports = mongoose.model("Timetable", timetableSchema);
