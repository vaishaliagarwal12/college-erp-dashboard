const mongoose = require("mongoose");
const config = require("../config");
const Tenant = require("../models/Tenant");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Resolves the active tenant from the X-Tenant-ID header (or DEFAULT_TENANT_ID).
// When neither is configured the API runs in single-tenant mode and no scoping applies.
const tenantMiddleware = asyncHandler(async (req, res, next) => {
  const candidate = req.headers["x-tenant-id"] || config.tenant.defaultTenantId;

  if (!candidate) {
    req.tenantId = null;
    req.tenant = null;
    return next();
  }

  if (!mongoose.isValidObjectId(candidate)) {
    throw new AppError("Invalid tenant id", 400);
  }

  const tenant = await Tenant.findById(candidate);
  if (!tenant) {
    throw new AppError("Tenant not found", 404);
  }
  if (tenant.status !== "Active") {
    throw new AppError("Tenant is inactive", 403);
  }

  req.tenantId = tenant._id;
  req.tenant = tenant;
  next();
});

module.exports = tenantMiddleware;
