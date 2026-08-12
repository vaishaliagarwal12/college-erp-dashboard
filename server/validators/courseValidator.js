const { z } = require("zod");

const STATUSES = ["Active", "Inactive"];

const createCourseSchema = z.object({
  courseName: z.string().trim().min(2, "Course name is required").max(100),
  courseCode: z.string().trim().min(2).max(10).toUpperCase(),
  department: z.string().trim().min(1, "Department is required").max(50),
  credits: z.coerce.number().min(1).max(20),
  semester: z.coerce.number().int().min(1).max(10),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(STATUSES).optional(),
});

const updateCourseSchema = createCourseSchema.partial();

module.exports = { createCourseSchema, updateCourseSchema };
