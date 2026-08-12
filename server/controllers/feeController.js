const mongoose = require("mongoose");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const STUDENT_FIELDS = "firstName lastName rollNumber email";

const POPULATE = [{ path: "student", select: STUDENT_FIELDS, populate: { path: "user", select: "name" } }];

const resolveStudent = async (value) => {
  if (mongoose.isValidObjectId(value)) return value;
  const student = await Student.findOne({ $or: [{ rollNumber: value }, { email: value }] }).select("_id");
  if (!student) throw new AppError(`Student not found: ${value}`, 400);
  return student._id;
};

const generateReceiptNumber = () =>
  `RCP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

const serializeFee = (fee) => ({
  id: fee._id,
  student: fee.student
    ? {
        id: fee.student._id,
        name: fee.student.user?.name || `${fee.student.firstName} ${fee.student.lastName}`.trim(),
        rollNumber: fee.student.rollNumber,
      }
    : null,
  semester: fee.semester,
  items: fee.items,
  totalAmount: fee.totalAmount,
  amountPaid: fee.amountPaid,
  balance: fee.totalAmount - fee.amountPaid,
  status: fee.status,
  dueDate: fee.dueDate,
  paymentHistory: fee.paymentHistory,
  createdAt: fee.createdAt,
  updatedAt: fee.updatedAt,
});

const findFullFee = (id) => Fee.findById(id).populate(POPULATE);

const getFees = asyncHandler(async (req, res) => {
  const { status, semester, student } = req.query;
  const { page, limit, skip } = getPagination(req.query, 20);

  const query = {};
  if (status) query.status = status;
  if (semester) query.semester = Number(semester);
  if (student) query.student = await resolveStudent(student);

  const [total, fees] = await Promise.all([
    Fee.countDocuments(query),
    Fee.find(query).populate(POPULATE).skip(skip).limit(limit).sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: fees.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: fees.map(serializeFee),
  });
});

const getFeeById = asyncHandler(async (req, res) => {
  const fee = await findFullFee(req.params.id);
  if (!fee) throw new AppError("Fee record not found", 404);
  res.status(200).json({ success: true, data: serializeFee(fee) });
});

const createFee = asyncHandler(async (req, res) => {
  const items = req.body.items || [];
  const totalAmount =
    req.body.totalAmount ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const fee = await Fee.create({
    student: await resolveStudent(req.body.student),
    semester: req.body.semester,
    items,
    totalAmount,
    dueDate: req.body.dueDate,
    remarks: req.body.remarks || "",
    createdBy: req.user._id,
  });

  const full = await findFullFee(fee._id);

  res.status(201).json({
    success: true,
    message: "Fee record created successfully",
    data: serializeFee(full),
  });
});

const updateFee = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.items !== undefined) {
    const items = updates.items;
    updates.totalAmount =
      req.body.totalAmount ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  const fee = await Fee.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!fee) throw new AppError("Fee record not found", 404);

  const full = await findFullFee(fee._id);

  res.status(200).json({
    success: true,
    message: "Fee record updated successfully",
    data: serializeFee(full),
  });
});

const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, reference = "" } = req.body;

  const fee = await Fee.findById(req.params.id);
  if (!fee) throw new AppError("Fee record not found", 404);

  const remaining = fee.totalAmount - fee.amountPaid;
  if (amount > remaining) {
    throw new AppError(`Payment exceeds outstanding balance (${remaining.toFixed(2)})`, 400);
  }

  const receiptNumber = generateReceiptNumber();
  fee.amountPaid += amount;
  fee.paymentHistory.push({
    amount,
    method,
    reference,
    receiptNumber,
    paidBy: req.user._id,
  });

  await fee.save();
  const full = await findFullFee(fee._id);

  res.status(200).json({
    success: true,
    message: "Payment recorded",
    data: { ...serializeFee(full), receipt: { receiptNumber, amount, method, paidAt: new Date() } },
  });
});

const getFeeSummary = asyncHandler(async (req, res) => {
  const [totalCollected, totalOutstanding, counts] = await Promise.all([
    Fee.aggregate([{ $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
    Fee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ["$totalAmount", "$amountPaid"] } },
        },
      },
    ]),
    Fee.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  res.status(200).json({
    success: true,
    data: {
      totalCollected: totalCollected[0]?.total || 0,
      totalOutstanding: totalOutstanding[0]?.total || 0,
      statusCounts,
    },
  });
});

const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) throw new AppError("Fee record not found", 404);

  res.status(200).json({
    success: true,
    message: "Fee record deleted successfully",
  });
});

module.exports = {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  recordPayment,
  getFeeSummary,
  deleteFee,
};
