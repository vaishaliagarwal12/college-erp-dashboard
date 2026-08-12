const { z } = require("zod");

const createAdmissionSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z.string().trim().min(7, "Valid phone number is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().trim().max(100).optional(),
  guardianPhone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  course: z.string().min(1, "Course is required"),
  department: z.string().min(1, "Department is required"),
  semester: z.number().int().min(1).max(12),
  batch: z.number().int().min(2000).max(2100),
});

const rejectAdmissionSchema = z.object({
  remarks: z.string().trim().max(500).optional(),
});

const paramIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
});

module.exports = {
  createAdmissionSchema,
  rejectAdmissionSchema,
  paramIdSchema,
};
