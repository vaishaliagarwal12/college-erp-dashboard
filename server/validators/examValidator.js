const { z } = require("zod");

const EXAM_TYPES = ["Quiz", "Midterm", "Final", "Practical", "Assignment"];
const EXAM_STATUSES = ["Scheduled", "Completed", "Published", "Cancelled"];

const createExamSchema = z.object({
  examName: z.string().trim().min(1, "Exam name is required").max(100),
  examType: z.enum(EXAM_TYPES).optional().default("Midterm"),
  course: z.string().trim().min(1, "Course is required"),
  semester: z.coerce.number().int().min(1).max(10),
  date: z.coerce.date().optional(),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Use HH:mm format").optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional().default(60),
  maxMarks: z.coerce.number().int().min(1).max(1000),
  status: z.enum(EXAM_STATUSES).optional().default("Scheduled"),
});

const updateExamSchema = createExamSchema.partial();

module.exports = { createExamSchema, updateExamSchema };
