const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    hours: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const syllabusSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
      index: true,
    },

    programOutcomes: {
      type: [String],
      default: [],
    },

    courseOutcomes: {
      type: [String],
      default: [],
    },

    units: {
      type: [unitSchema],
      default: [],
    },

    textbooks: {
      type: [String],
      default: [],
    },

    recommendedHours: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model("Syllabus", syllabusSchema);
