const mongoose = require("mongoose");

const NOTIFICATION_TYPES = ["Info", "Success", "Warning", "Alert"];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: "Info",
      index: true,
    },

    link: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
