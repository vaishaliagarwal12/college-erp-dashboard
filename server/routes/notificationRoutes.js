const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  getMyNotifications,
  getUnreadCount,
  createNotification,
  bulkNotify,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const {
  createNotificationSchema,
  bulkNotifySchema,
} = require("../validators/notificationValidator");

const router = express.Router();

router.use(protect);

// Users manage their own notifications
router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

// Staff create notifications
router.post("/", requirePermission("notifications", "write"), validate(createNotificationSchema), createNotification);
router.post("/bulk", requirePermission("notifications", "write"), validate(bulkNotifySchema), bulkNotify);

module.exports = router;
