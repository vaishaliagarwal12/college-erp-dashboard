const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });

const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId, type: "refresh", jti: crypto.randomUUID() },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpire }
  );

// Store only a hash of the refresh token server-side
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const verifyAccessToken = (token) => jwt.verify(token, config.jwtSecret);

const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, config.refreshTokenSecret);
  if (decoded.type !== "refresh") {
    const err = new Error("Invalid token type");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded;
};

const generateResetToken = (userId) =>
  jwt.sign({ id: userId, type: "reset" }, config.jwtSecret, {
    expiresIn: "30m",
  });

const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (decoded.type !== "reset") {
    const err = new Error("Invalid token type");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded;
};

const generateVerifyToken = (userId) =>
  jwt.sign({ id: userId, type: "verify" }, config.jwtSecret, {
    expiresIn: "24h",
  });

const verifyVerifyToken = (token) => {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (decoded.type !== "verify") {
    const err = new Error("Invalid token type");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
  generateVerifyToken,
  verifyVerifyToken,
};
