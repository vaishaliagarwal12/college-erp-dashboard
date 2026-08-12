const { z } = require("zod");

const STATUSES = ["Present", "Absent", "Late", "On Leave"];
const PERIODS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const attendanceSchema = z.object({
  student: z.string().trim().min(1, "Student is required"),
  course: z.string().trim().min(1, "Course is required"),
  date: z.coerce.date("Valid date is required"),
  period: z.enum(PERIODS).optional().default("1"),
  status: z.enum(STATUSES),
  remarks: z.string().trim().max(300).optional().default(""),
});

const createAttendanceSchema = attendanceSchema;

const updateAttendanceSchema = attendanceSchema.partial();

const bulkAttendanceSchema = z.object({
  records: z
    .array(attendanceSchema)
    .min(1, "At least one attendance record is required")
    .max(200, "Maximum 200 records per request"),
});

const querySchema = z.object({
  student: z.string().trim().optional(),
  course: z.string().trim().optional(),
  department: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = {
  createAttendanceSchema,
  updateAttendanceSchema,
  bulkAttendanceSchema,
  querySchema,
};
