const { z } = require("zod");

const feeItemSchema = z.object({
  itemName: z.string().trim().min(1, "Item name is required").max(100),
  amount: z.coerce.number().nonnegative("Amount must be non-negative"),
});

const createFeeSchema = z.object({
  student: z.string().trim().min(1, "Student is required"),
  semester: z.coerce.number().int().min(1).max(12),
  items: z.array(feeItemSchema).min(1, "At least one fee item is required"),
  totalAmount: z.coerce.number().nonnegative().optional(),
  dueDate: z.coerce.date().optional(),
  remarks: z.string().trim().max(300).optional(),
});

const updateFeeSchema = createFeeSchema.partial();

const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["Cash", "Card", "Bank Transfer", "UPI", "Cheque"]),
  reference: z.string().trim().max(100).optional(),
});

module.exports = {
  createFeeSchema,
  updateFeeSchema,
  recordPaymentSchema,
};
