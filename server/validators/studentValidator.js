const { z } = require("zod");

const GENDERS = ["Male", "Female", "Other"];
const STATUSES = ["Active", "Inactive"];

const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8).max(100).optional(),
  rollNumber: z.string().trim().min(1, "Roll number is required").max(20),
  phone: z.string().trim().min(7, "Phone number is too short").max(20),
  gender: z.enum(GENDERS),
  course: z.string().trim().min(1, "Course is required").max(50),
  department: z.string().trim().min(1, "Department is required").max(50),
  semester: z.coerce.number().int().min(1).max(10),
  batch: z.coerce.number().int().min(1900).max(2100),
  section: z.string().trim().min(1, "Section is required").max(10),
  address: z.string().trim().max(300).optional(),
  status: z.enum(STATUSES).optional(),
});

const updateStudentSchema = createStudentSchema.partial();

module.exports = { createStudentSchema, updateStudentSchema };
