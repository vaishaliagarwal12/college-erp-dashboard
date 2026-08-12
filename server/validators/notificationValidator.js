const { z } = require("zod");

const createNotificationSchema = z.object({
  recipient: z.string().trim().min(1, "Recipient is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  message: z.string().trim().max(1000).optional(),
  type: z.enum(["Info", "Success", "Warning", "Alert"]).optional(),
  link: z.string().trim().max(300).optional(),
});

const bulkNotifySchema = z.object({
  recipients: z.array(z.string().trim().min(1)).min(1, "At least one recipient is required").max(200),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().max(1000).optional(),
  type: z.enum(["Info", "Success", "Warning", "Alert"]).optional(),
  link: z.string().trim().max(300).optional(),
});

const paramIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
});

module.exports = {
  createNotificationSchema,
  bulkNotifySchema,
  paramIdSchema,
};
