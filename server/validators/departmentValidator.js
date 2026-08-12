const { z } = require("zod");

const STATUSES = ["Active", "Inactive"];

const createDepartmentSchema = z.object({
  departmentName: z
    .string()
    .trim()
    .min(2, "Department name is required")
    .max(50),
  departmentCode: z.string().trim().min(2).max(10).toUpperCase(),
  hod: z.string().trim().min(1, "Head of department is required").max(50),
  status: z.enum(STATUSES).optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

module.exports = { createDepartmentSchema, updateDepartmentSchema };
