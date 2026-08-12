const express = require("express");
const {
  registerUser,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
} = require("../controllers/authController");
const { protect, requirePermission } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
} = require("../validators/authValidator");
const { googleAuth, googleCallback } = require("../controllers/ssoController");

const router = express.Router();

// Public
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", authLimiter, validate(refreshSchema), refresh);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);
router.post(
  "/verify-email",
  authLimiter,
  validate(verifyEmailSchema),
  verifyEmail
);
router.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  resendVerification
);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Authenticated
router.get("/me", protect, me);
router.post("/logout", protect, logout);
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword
);

// Authenticated
router.get("/me", protect, me);
router.post("/logout", protect, logout);

// Admin only (seed the first admin via: npm run seed:admin)
router.post(
  "/register",
  protect,
  requirePermission("users", "write"),
  validate(registerSchema),
  registerUser
);

module.exports = router;
