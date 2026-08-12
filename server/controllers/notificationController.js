const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const { getIO } = require("../io");

const emitNotification = (notification) => {
  const io = getIO();
  if (io) {
    io.to(`user:${String(notification.recipient)}`).emit(
      "notification:new",
      serializeNotification(notification)
    );
  }
};

const resolveRecipient = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const user = await User.findOne({ $or: [{ email: value }, { username: value }] }).select("_id");
  if (!user) throw new AppError(`Recipient not found: ${value}`, 400);
  return user._id;
};

const serializeNotification = (n) => ({
  id: n._id,
  recipient: n.recipient,
  title: n.title,
  message: n.message,
  type: n.type,
  link: n.link,
  read: n.read,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

const getMyNotifications = asyncHandler(async (req, res) => {
  const { type, read } = req.query;
  const { page, limit, skip } = getPagination(req.query, 20);

  const query = { recipient: req.user._id };
  if (type) query.type = type;
  if (read === "true") query.read = true;
  if (read === "false") query.read = false;

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(query),
    Notification.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: notifications.map(serializeNotification),
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.status(200).json({ success: true, data: { unreadCount: count } });
});

const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    recipient: await resolveRecipient(req.body.recipient),
    title: req.body.title,
    message: req.body.message || "",
    type: req.body.type || "Info",
    link: req.body.link || "",
    createdBy: req.user._id,
  });

  emitNotification(notification);

  res.status(201).json({
    success: true,
    message: "Notification created",
    data: serializeNotification(notification),
  });
});

const bulkNotify = asyncHandler(async (req, res) => {
  const recipientIds = [];
  for (const r of req.body.recipients) {
    recipientIds.push(await resolveRecipient(r));
  }

  const docs = recipientIds.map((recipient) => ({
    recipient,
    title: req.body.title,
    message: req.body.message || "",
    type: req.body.type || "Info",
    link: req.body.link || "",
    createdBy: req.user._id,
  }));

  const inserted = await Notification.insertMany(docs);

  for (const n of inserted) emitNotification(n);

  res.status(201).json({
    success: true,
    message: `${inserted.length} notification(s) created`,
    count: inserted.length,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { returnDocument: "after" }
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  res.status(200).json({ success: true, data: serializeNotification(notification) });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notification(s) marked as read`,
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  createNotification,
  bulkNotify,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
