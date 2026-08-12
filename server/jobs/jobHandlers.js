const Student = require("../models/Student");
const User = require("../models/User");
const Fee = require("../models/Fee");
const { toCSV } = require("../utils/export");
const fs = require("fs");
const path = require("path");

// Pluggable mailer. Swap `defaultMailer` for a real SMTP transport (nodemailer)
// once SMTP credentials are configured.
const defaultMailer = async ({ to, subject, text }) => {
  console.log(`[mail] "${subject}" -> ${to}`);
};

const EXPORT_DIR = () =>
  process.env.REPORT_DIR || path.join(__dirname, "..", "exports");

const ensureExportDir = () => {
  const dir = EXPORT_DIR();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createJobHandlers = ({ mailer = defaultMailer } = {}) => ({
  // Generic email job. data: { to, subject, text }
  email: async (data) => {
    await mailer(data);
  },

  // data: { daysOverdue = 30, dryRun = false }
  feeReminder: async (data = {}) => {
    const daysOverdue = Number(data.daysOverdue) || 30;
    const since = new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000);

    const outstanding = await Fee.aggregate([
      {
        $match: {
          status: { $in: ["Unpaid", "Partially Paid", "Overdue"] },
          $or: [{ dueDate: { $lt: since } }, { dueDate: null }],
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "users",
          localField: "student.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          email: "$user.email",
          studentName: {
            $concat: ["$student.firstName", " ", "$student.lastName"],
          },
          rollNumber: "$student.rollNumber",
          semester: 1,
          dueAmount: { $subtract: ["$totalAmount", "$amountPaid"] },
        },
      },
    ]);

    if (data.dryRun) {
      return { count: outstanding.length, recipients: outstanding };
    }

    for (const row of outstanding) {
      await mailer({
        to: row.email,
        subject: "Fee payment reminder",
        text: `Dear ${row.studentName} (${row.rollNumber}), your outstanding balance of ${row.dueAmount} is due. Please pay before the due date.`,
      });
    }

    return { count: outstanding.length };
  },

  // data: { type = "fees" }
  reportGeneration: async (data = {}) => {
    const type = data.type || "fees";
    ensureExportDir();
    const filename = `report-${type}-${Date.now()}.csv`;
    const filePath = path.join(EXPORT_DIR(), filename);

    let rows = [];
    if (type === "fees") {
      rows = await Fee.aggregate([
        {
          $lookup: {
            from: "students",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: false } },
        {
          $project: {
            rollNumber: "$student.rollNumber",
            semester: 1,
            totalAmount: 1,
            amountPaid: 1,
            status: 1,
          },
        },
      ]);
    }

    const csv = toCSV(
      ["rollNumber", "semester", "totalAmount", "amountPaid", "status"],
      rows.map((r) => ({
        rollNumber: r.rollNumber || "",
        semester: r.semester || "",
        totalAmount: r.totalAmount || 0,
        amountPaid: r.amountPaid || 0,
        status: r.status || "",
      }))
    );
    fs.writeFileSync(filePath, csv);

    return { type, filePath, rows: rows.length };
  },
});

module.exports = { createJobHandlers, defaultMailer };
