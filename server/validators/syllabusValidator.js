const { z } = require("zod");

const unitSchema = z.object({
  title: z.string().trim().min(1, "Unit title is required").max(200),
  topics: z
    .array(z.string().trim().min(1, "Topic cannot be empty"))
    .max(100)
    .optional()
    .default([]),
  hours: z.coerce.number().min(0).max(200).optional().default(0),
});

const syllabusSchema = z.object({
  course: z.string().trim().min(1, "Course is required"),
  programOutcomes: z
    .array(z.string().trim().min(1, "Outcome cannot be empty"))
    .max(100)
    .optional()
    .default([]),
  courseOutcomes: z
    .array(z.string().trim().min(1, "Outcome cannot be empty"))
    .max(100)
    .optional()
    .default([]),
  units: z.array(unitSchema).max(50).optional().default([]),
  textbooks: z
    .array(z.string().trim().min(1, "Textbook cannot be empty"))
    .max(100)
    .optional()
    .default([]),
  recommendedHours: z.coerce.number().min(0).max(1000).optional().default(0),
  status: z.enum(["Active", "Inactive"]).optional(),
});

const createSyllabusSchema = syllabusSchema;

const updateSyllabusSchema = syllabusSchema.partial();

module.exports = {
  createSyllabusSchema,
  updateSyllabusSchema,
};
