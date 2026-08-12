const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
  generateVerifyToken,
  verifyVerifyToken,
} = require("../utils/token");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { STAFF_ROLES } = require("../config/roles");

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
});

const isPasswordExpired = (user) => {
  const maxAgeDays = config.security.passwordMaxAgeDays;
  if (!maxAgeDays || !user.passwordChangedAt) return false;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  return Date.now() - user.passwordChangedAt.getTime() > maxAgeMs;
};

const saveVerificationToken = async (userId, token) =>
  User.updateOne(
    { _id: userId },
    {
      $set: {
        emailVerificationToken: hashToken(token),
        emailVerificationTokenExpiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),
      },
    }
  );

// Persist the hashed refresh token + its expiry derived from the JWT
const saveRefreshToken = async (userId, token) => {
  const decoded = jwt.decode(token);
  const expiresAt = decoded && decoded.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        refreshToken: hashToken(token),
        refreshTokenExpiresAt: expiresAt,
      },
    }
  );
};

// Backwards-compatible generateToken helper
const generateToken = (id) => {
  return generateAccessToken(id);
};

const issueTokens = (user) => ({
  accessToken: generateAccessToken(user._id),
  refreshToken: generateRefreshToken(user._id),
});

// Register a new user account (restricted to admin staff)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("User already exists", 409);
  }

  const user = await User.create({ name, email, password, role });

  const verificationToken = generateVerifyToken(user._id);
  await saveVerificationToken(user._id, verificationToken);

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please verify the email address.",
    data: toPublicUser(user),
    verificationToken,
    verifyLink: `${config.clientUrl}/verify-email?token=${verificationToken}`,
  });
});

// Login — issue access + refresh tokens, with failed-attempt lockout
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      `Account is temporarily locked. Try again in ${minutes} minute(s).`,
      429
    );
  }

  if (user.status !== "Active") {
    throw new AppError("Account is disabled. Contact your administrator.", 401);
  }

  if (config.security.requireEmailVerification && !user.emailVerified) {
    throw new AppError("Please verify your email before signing in.", 403);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const attempts = (user.failedLoginAttempts || 0) + 1;

    if (attempts >= config.security.lockoutMaxAttempts) {
      const lockedUntil = new Date(
        Date.now() + config.security.lockoutWindowMs
      );
      await User.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts: 0, lockedUntil } }
      );
      throw new AppError(
        `Too many failed attempts. Account locked for ${Math.ceil(
          config.security.lockoutWindowMs / 60000
        )} minute(s).`,
        429
      );
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: attempts } }
    );
    throw new AppError("Invalid email or password", 401);
  }

  // Successful login — clear lockout state
  await User.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lockedUntil: null } }
  );

  const { accessToken, refreshToken } = issueTokens(user);
  await saveRefreshToken(user._id, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: accessToken, // for legacy client compatibility
    accessToken,
    refreshToken,
    role: user.role,
    emailVerified: user.emailVerified,
    passwordExpired: isPasswordExpired(user),
    data: toPublicUser(user),
  });
});

// Refresh — rotate the refresh token and issue a new access token
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(decoded.id).select(
    "+refreshToken +refreshTokenExpiresAt"
  );

  if (!user || user.status !== "Active") {
    throw new AppError("Invalid refresh token", 401);
  }

  const storedHash = hashToken(refreshToken);
  const expired =
    user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now();

  if (!user.refreshToken || user.refreshToken !== storedHash || expired) {
    // Reused or stale refresh token → invalidate all sessions
    await User.updateOne(
      { _id: user._id },
      { $set: { refreshToken: null, refreshTokenExpiresAt: null } }
    );
    throw new AppError("Invalid refresh token. Please log in again.", 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = issueTokens(user);
  await saveRefreshToken(user._id, newRefreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    token: accessToken,
    accessToken,
    refreshToken: newRefreshToken,
    data: toPublicUser(user),
  });
});

// Logout — revoke the refresh token (stateless access token expires on its own)
const logout = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    { $set: { refreshToken: null, refreshTokenExpiresAt: null } }
  );

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Current authenticated user
const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    passwordExpired: isPasswordExpired(req.user),
    data: toPublicUser(req.user),
  });
});

// Verify an email address using a signed verification token
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  let decoded;
  try {
    decoded = verifyVerifyToken(token);
  } catch {
    throw new AppError("Invalid or expired verification token", 400);
  }

  const user = await User.findById(decoded.id).select(
    "+emailVerificationToken +emailVerificationTokenExpiresAt"
  );

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  if (user.emailVerified) {
    return res.status(200).json({
      success: true,
      message: "Email already verified",
    });
  }

  if (
    user.emailVerificationToken !== hashToken(token) ||
    (user.emailVerificationTokenExpiresAt &&
      user.emailVerificationTokenExpiresAt.getTime() < Date.now())
  ) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

// Resend a verification link for an unverified account (dev mode returns token)
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.emailVerified) {
    // Never reveal whether an account exists
    return res.status(200).json({
      success: true,
      message:
        "If an unverified account exists for that email, a verification link has been generated.",
    });
  }

  const verificationToken = generateVerifyToken(user._id);
  await saveVerificationToken(user._id, verificationToken);

  res.status(200).json({
    success: true,
    message: "Verification link generated",
    verificationToken,
    verifyLink: `${config.clientUrl}/verify-email?token=${verificationToken}`,
  });
});

// Change the current user's password (current password required, no reuse)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select(
    "+password +passwordHistory"
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  if (await user.isPasswordReused(newPassword)) {
    throw new AppError(
      "Password has been used recently. Choose a different one.",
      400
    );
  }

  user.setNewPassword(newPassword, config.security.passwordHistoryLength);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// Roles an admin may create through the register endpoint
const canAssignRole = (role) => STAFF_ROLES.includes(role);

// Request a password reset token
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If an account exists for that email, a reset link has been generated.",
    });
  }

  const token = generateResetToken(user._id);
  const resetLink = `${config.clientUrl}/reset-password?token=${token}`;

  res.status(200).json({
    success: true,
    message: "Password reset token generated",
    resetToken: token,
    resetLink,
  });
});

// Reset the password using a valid reset token, then revoke all sessions
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = verifyResetToken(token);
  } catch {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const user = await User.findById(decoded.id).select("+password +passwordHistory");

  if (!user || user.status !== "Active") {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (await user.isPasswordReused(password)) {
    throw new AppError(
      "Password has been used recently. Choose a different one.",
      400
    );
  }

  user.setNewPassword(password, config.security.passwordHistoryLength);
  await user.save();

  // Invalidate any active sessions and clear lockout state
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
});

module.exports = {
  generateToken,
  registerUser,
  canAssignRole,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  toPublicUser,
  issueTokens,
  saveRefreshToken,
};
