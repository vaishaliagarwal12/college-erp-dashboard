const { z } = require("zod");

const createResultSchema = z.object({
  student: z.string().trim().min(1, "Student is required"),
  exam: z.string().trim().min(1, "Exam is required"),
  marksObtained: z.coerce.number().min(0),
  maxMarks: z.coerce.number().int().min(1).optional(),
  grade: z.string().trim().max(5).optional(),
  remarks: z.string().trim().max(300).optional().default(""),
});

const updateResultSchema = createResultSchema.partial();

module.exports = { createResultSchema, updateResultSchema };
