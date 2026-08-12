const mongoose = require("mongoose");

const FEE_STATUSES = ["Unpaid", "Partially Paid", "Paid", "Overdue"];
const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "UPI", "Cheque"];

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    reference: { type: String, trim: true, default: "" },
    receiptNumber: { type: String, required: true, unique: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const feeItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    semester: { type: Number, required: true, index: true },

    items: { type: [feeItemSchema], default: [] },

    totalAmount: { type: Number, required: true, min: 0 },

    amountPaid: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: FEE_STATUSES,
      default: "Unpaid",
      index: true,
    },

    dueDate: { type: Date },

    paymentHistory: { type: [paymentEntrySchema], default: [] },

    remarks: { type: String, trim: true, maxlength: 300, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, semester: 1 }, { unique: true });

feeSchema.pre("save", function syncStatus() {
  const remaining = this.totalAmount - this.amountPaid;
  if (remaining <= 0) this.status = "Paid";
  else if (this.amountPaid > 0) this.status = "Partially Paid";
  else if (this.dueDate && this.dueDate < new Date()) this.status = "Overdue";
  else this.status = "Unpaid";
});

module.exports = mongoose.model("Fee", feeSchema);
module.exports.FEE_STATUSES = FEE_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
