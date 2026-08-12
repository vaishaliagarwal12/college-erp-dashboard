const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/token");
const { PERMISSIONS } = require("../config/permissions");

// Protect: verify Bearer access token and load the user onto req.user and req.admin
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized. No token provided.", 401);
  }

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new AppError(
      "Not authorized. Account no longer exists.",
      401
    );
  }

  if (user.status !== "Active") {
    throw new AppError("Not authorized. Account is disabled.", 401);
  }

  req.user = user;
  req.admin = user; // backwards compatibility
  next();
});

// Authorize: restrict to an explicit set of roles
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.admin?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};

// Data-driven RBAC: check the permission map for module + action
const requirePermission = (module, action) => {
  return (req, res, next) => {
    const allowedRoles = PERMISSIONS[module]?.[action];

    if (!allowedRoles) {
      return res.status(500).json({
        success: false,
        message: `Permission not defined for ${module}.${action}`,
      });
    }

    if (!req.user && !req.admin) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const userRole = req.user?.role || req.admin?.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  requirePermission,
};
