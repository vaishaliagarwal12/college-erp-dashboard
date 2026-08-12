const { z } = require("zod");
const { ROLE_LIST } = require("../config/roles");

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  role: z.enum(ROLE_LIST).default("Student"),
  status: z.enum(["Active", "Inactive"]).optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    role: z.enum(ROLE_LIST).optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field to update is required",
  });

module.exports = { createUserSchema, updateUserSchema };
