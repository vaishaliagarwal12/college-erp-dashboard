const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:5000/api/v1/auth/google/callback";

const app = require("../app");
const User = require("../models/User");
const { hashToken } = require("../utils/token");

let mongo;
let originalFetch;

before(async () => {
  mongo = await startDb();
  originalFetch = global.fetch;
});

after(async () => {
  global.fetch = originalFetch;
  await stopDb(mongo);
});

beforeEach(async () => {
  await clearDb();
});

const mockFetch = ({ tokenOk = true, infoOk = true, email, verified = true }) => {
  global.fetch = async (url) => {
    if (String(url).includes("oauth2.googleapis.com/token")) {
      return tokenOk
        ? { ok: true, status: 200, json: async () => ({ access_token: "test-access-token" }) }
        : { ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) };
    }
    return infoOk
      ? {
          ok: true,
          status: 200,
          json: async () => ({ sub: "123", email, email_verified: verified, name: "Google User" }),
        }
      : { ok: false, status: 401, json: async () => ({ error: "invalid_token" }) };
  };
};

test("GET /api/v1/auth/google — 302 redirect to Google consent screen", async () => {
  const res = await request(app).get("/api/v1/auth/google");

  assert.equal(res.status, 302);
  assert.ok(res.headers.location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
  assert.ok(res.headers.location.includes("client_id=test-client-id"));
  assert.ok(res.headers.location.includes("redirect_uri="));
  assert.ok(res.headers.location.includes("state="));
});

test("GET /api/v1/auth/google/callback — 400 without code", async () => {
  const res = await request(app).get("/api/v1/auth/google/callback");
  assert.equal(res.status, 400);
  assert.equal(res.body.message, "Missing authorization code");
});

test("GET /api/v1/auth/google/callback — 200 creates a new user and returns tokens", async () => {
  mockFetch({ email: "new.student@gmail.com" });

  const res = await request(app).get(
    "/api/v1/auth/google/callback?code=valid-code"
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.accessToken);
  assert.ok(res.body.refreshToken);
  assert.equal(res.body.data.email, "new.student@gmail.com");
  assert.equal(res.body.data.name, "Google User");
  assert.equal(res.body.data.role, "Student");

  const user = await User.findOne({ email: "new.student@gmail.com" }).select(
    "+refreshToken"
  );
  assert.ok(user);
  assert.ok(user.refreshToken);
  assert.equal(user.refreshToken, hashToken(res.body.refreshToken));
});

test("GET /api/v1/auth/google/callback — 200 links an existing user by email", async () => {
  const existing = await User.create({
    name: "Existing Student",
    email: "existing@gmail.com",
    password: "password123",
    role: "Student",
  });
  mockFetch({ email: existing.email });

  const res = await request(app).get(
    "/api/v1/auth/google/callback?code=valid-code"
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.data.id, existing._id.toString());
  assert.equal(await User.countDocuments({ email: existing.email }), 1);
});

test("GET /api/v1/auth/google/callback — 401 for unverified Google account", async () => {
  mockFetch({ email: "unverified@gmail.com", verified: false });

  const res = await request(app).get(
    "/api/v1/auth/google/callback?code=valid-code"
  );

  assert.equal(res.status, 401);
  assert.equal(await User.countDocuments(), 0);
});

test("GET /api/v1/auth/google/callback — 302 to SPA login with tokens for browsers", async () => {
  mockFetch({ email: "spa.user@gmail.com" });

  const res = await request(app)
    .get("/api/v1/auth/google/callback?code=valid-code")
    .set("Accept", "text/html");

  assert.equal(res.status, 302);
  assert.ok(res.headers.location.startsWith("http://localhost:5173/login?"));
  assert.ok(res.headers.location.includes("accessToken="));
  assert.ok(res.headers.location.includes("user="));
});

test("GET /api/v1/auth/google/callback — 502 when token exchange fails", async () => {
  mockFetch({ tokenOk: false });

  const res = await request(app).get(
    "/api/v1/auth/google/callback?code=bad-code"
  );

  assert.equal(res.status, 502);
  assert.equal(res.body.message, "Server error");
});
