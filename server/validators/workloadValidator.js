const { z } = require("zod");

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

const workloadSchema = z.object({
  faculty: z.string().trim().min(1, "Faculty is required"),
  course: z.string().trim().min(1, "Course is required"),
  department: z.string().trim().min(1, "Department is required"),
  semester: z.coerce.number().int().min(1).max(12),
  academicYear: z
    .string()
    .trim()
    .regex(ACADEMIC_YEAR_REGEX, "Academic year must use YYYY-YYYY, e.g. 2026-2027"),
  section: z
    .string()
    .trim()
    .min(1)
    .max(5)
    .toUpperCase()
    .optional()
    .default("A"),
  teachingHoursPerWeek: z.coerce.number().int().min(1).max(60),
  role: z.enum(["Primary", "Coordinator", "Lab"]).optional().default("Primary"),
});

const createWorkloadSchema = workloadSchema;

const updateWorkloadSchema = workloadSchema.partial();

module.exports = {
  createWorkloadSchema,
  updateWorkloadSchema,
};
