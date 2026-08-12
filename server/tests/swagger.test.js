const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const apiSpec = require("../docs/swagger");

let mongo;

before(async () => {
  mongo = await startDb();
});

after(async () => {
  await stopDb(mongo);
});

test("GET /api-docs/ — serves the Swagger UI", async () => {
  const res = await request(app).get("/api-docs/");
  assert.equal(res.status, 200);
  assert.match(res.text, /Swagger UI/);
});

test("GET /api-docs — redirects to the trailing-slash UI", async () => {
  const res = await request(app).get("/api-docs");
  assert.equal(res.status, 301);
});

test("Swagger spec — has info, security scheme, and expected tags", () => {
  assert.equal(apiSpec.openapi.startsWith("3."), true);
  assert.equal(apiSpec.info.title, "College ERP API");
  assert.ok(apiSpec.components.securitySchemes.bearerAuth);
  assert.ok(apiSpec.paths["/api/v1/workload"]);
  assert.ok(apiSpec.paths["/api/v1/curriculum"]);
  assert.ok(apiSpec.paths["/api/v1/jobs/fee-reminders"]);
  assert.ok(apiSpec.paths["/api/v1/auth/google"]);
  assert.ok(apiSpec.paths["/api/v1/dashboard/analytics"]);
});
