const { z } = require("zod");

const GENDERS = ["Male", "Female", "Other"];
const STATUSES = ["Active", "Inactive"];

const createFacultySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  employeeId: z.string().trim().min(1, "Employee ID is required").max(20),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8).max(100).optional(),
  phone: z.string().trim().min(7, "Phone number is too short").max(20),
  gender: z.enum(GENDERS),
  department: z.string().trim().min(1, "Department is required").max(50),
  designation: z.string().trim().min(1, "Designation is required").max(50),
  qualification: z.string().trim().min(1, "Qualification is required").max(100),
  experience: z.coerce.number().min(0).max(60),
  status: z.enum(STATUSES).optional(),
});

const updateFacultySchema = createFacultySchema.partial();

module.exports = { createFacultySchema, updateFacultySchema };
