const crypto = require("crypto");
const config = require("../config");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  toPublicUser,
  issueTokens,
  saveRefreshToken,
} = require("./authController");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// Start the Google OAuth flow (302 to Google's consent screen)
const googleAuth = asyncHandler(async (req, res) => {
  if (!config.google.enabled) {
    throw new AppError("Google SSO is not configured", 503);
  }

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    state: crypto.randomBytes(16).toString("hex"),
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// Exchange the authorization code, upsert the user, and issue tokens
const googleCallback = asyncHandler(async (req, res) => {
  if (!config.google.enabled) {
    throw new AppError("Google SSO is not configured", 503);
  }

  const { code } = req.query;
  if (!code) {
    throw new AppError("Missing authorization code", 400);
  }

  let tokenData;
  let profile;
  try {
    const tokenRes = await global.fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new AppError("Failed to exchange authorization code", 502);
    }

    const infoRes = await global.fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    profile = await infoRes.json();

    if (!infoRes.ok || profile.email_verified !== true || !profile.email) {
      throw new AppError("Google account is not verified", 401);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Google OAuth request failed", 502);
  }

  const email = profile.email.toLowerCase();
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.name || email.split("@")[0],
      email,
      password: crypto.randomBytes(24).toString("hex"),
      emailVerified: true,
    });
  } else {
    if (user.status !== "Active") {
      throw new AppError("Account is disabled. Contact your administrator.", 401);
    }
    // Google verified the address — mark it verified if it wasn't already
    if (!user.emailVerified) {
      await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
      user.emailVerified = true;
    }
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await saveRefreshToken(user._id, refreshToken);

  const wantsHtml = (req.headers.accept || "").includes("text/html");
  if (wantsHtml) {
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      user: JSON.stringify(toPublicUser(user)),
    });
    res.redirect(`${config.clientUrl}/login?${params.toString()}`);
    return;
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    refreshToken,
    data: toPublicUser(user),
  });
});

module.exports = {
  googleAuth,
  googleCallback,
};
