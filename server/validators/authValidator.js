const { z } = require("zod");
const { ROLE_LIST } = require("../config/roles");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  role: z.enum(ROLE_LIST).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required").max(100),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resendVerificationSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(100),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
};
