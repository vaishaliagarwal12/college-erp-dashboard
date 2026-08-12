const dotenv = require("dotenv");

dotenv.config();

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "JWT_EXPIRE"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error("   Copy server/.env.example to server/.env and fill in the values.");
    process.exit(1);
  }
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "15m",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
  refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  serverUrl: process.env.SERVER_URL || "http://localhost:5000",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.SERVER_URL || "http://localhost:5000"}/api/v1/auth/google/callback`,
    enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
  authRateLimit: {
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  },
  security: {
    // Lock an account after this many consecutive failed logins
    lockoutMaxAttempts: Number(process.env.LOCKOUT_MAX_ATTEMPTS) || 5,
    // Duration the account stays locked after reaching the limit
    lockoutWindowMs: Number(process.env.LOCKOUT_WINDOW_MS) || 15 * 60 * 1000,
    // Recent password hashes kept per user to block reuse
    passwordHistoryLength: Number(process.env.PASSWORD_HISTORY_LENGTH) || 5,
    // Force a password change after this many days (0 disables expiry)
    passwordMaxAgeDays: Number(process.env.PASSWORD_MAX_AGE_DAYS) || 0,
    // Block login until the email address is verified
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  },
  workload: {
    // Max teaching hours a faculty member can carry per week across a term
    maxWeeklyHours: Number(process.env.WORKLOAD_MAX_WEEKLY_HOURS) || 20,
  },
  redisUrl: process.env.REDIS_URL || "",
  tenant: {
    // Set to a Tenant _id to force single-tenant isolation on core reference data
    defaultTenantId: process.env.DEFAULT_TENANT_ID || "",
  },
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
};

module.exports = config;
