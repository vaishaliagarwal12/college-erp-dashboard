const { z } = require("zod");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const timeSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Use HH:mm format");

const baseTimetableSchema = z.object({
  dayOfWeek: z.enum(DAYS),
  startTime: timeSchema,
  endTime: timeSchema,
  course: z.string().trim().min(1, "Course is required"),
  faculty: z.string().trim().optional(),
  department: z.string().trim().min(1, "Department is required"),
  semester: z.coerce.number().int().min(1).max(10),
  section: z.string().trim().min(1).max(10).default("A"),
  room: z.string().trim().max(50).optional(),
});

const createTimetableSchema = baseTimetableSchema.refine(
  (data) => data.endTime > data.startTime,
  {
    path: ["endTime"],
    message: "End time must be after start time",
  }
);

const updateTimetableSchema = baseTimetableSchema.partial();

module.exports = { createTimetableSchema, updateTimetableSchema };
