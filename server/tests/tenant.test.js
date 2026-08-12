const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { setupTestEnv, startDb, stopDb, clearDb } = require("./helpers");
setupTestEnv();

const app = require("../app");
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Department = require("../models/Department");
const { generateAccessToken } = require("../utils/token");

let mongo;

before(async () => {
  mongo = await startDb();
});

after(async () => {
  await stopDb(mongo);
});

beforeEach(async () => {
  await clearDb();
});

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const tenantHeader = (id) => ({ "X-Tenant-ID": String(id) });

const seedAdmin = async () =>
  User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "password123",
    role: "Admin",
  });

test("GET /api/v1/departments — scopes records by X-Tenant-ID", async () => {
  const admin = await seedAdmin();
  const token = generateAccessToken(admin._id);
  const tenantA = await Tenant.create({ name: "College A", code: "COLA" });
  const tenantB = await Tenant.create({ name: "College B", code: "COLB" });

  await request(app)
    .post("/api/v1/departments")
    .set({ ...bearer(token), ...tenantHeader(tenantA._id) })
    .send({ departmentName: "CS A", departmentCode: "CS", hod: "Dr A" })
    .expect(201);
  await request(app)
    .post("/api/v1/departments")
    .set({ ...bearer(token), ...tenantHeader(tenantB._id) })
    .send({ departmentName: "CS B", departmentCode: "CS", hod: "Dr B" })
    .expect(201);
  await Department.create({
    departmentName: "Plain",
    departmentCode: "PLN",
    hod: "Dr P",
  });

  // Both tenants can use the same department code — unique per tenant.
  const listA = await request(app)
    .get("/api/v1/departments")
    .set({ ...bearer(token), ...tenantHeader(tenantA._id) });
  assert.equal(listA.status, 200);
  assert.deepEqual(
    listA.body.data.map((d) => d.departmentCode),
    ["CS"]
  );

  const listB = await request(app)
    .get("/api/v1/departments")
    .set({ ...bearer(token), ...tenantHeader(tenantB._id) });
  assert.deepEqual(
    listB.body.data.map((d) => d.departmentCode),
    ["CS"]
  );

  // No tenant header → single-tenant mode: no scoping, everything is visible
  const listPlain = await request(app)
    .get("/api/v1/departments")
    .set(bearer(token));
  assert.deepEqual(
    listPlain.body.data.map((d) => d.departmentCode).sort(),
    ["CS", "CS", "PLN"]
  );
});

test("GET /api/v1/departments/:id — cross-tenant access returns 404", async () => {
  const admin = await seedAdmin();
  const token = generateAccessToken(admin._id);
  const tenantA = await Tenant.create({ name: "College A", code: "COLA" });
  const tenantB = await Tenant.create({ name: "College B", code: "COLB" });

  const created = await request(app)
    .post("/api/v1/departments")
    .set({ ...bearer(token), ...tenantHeader(tenantA._id) })
    .send({ departmentName: "CS A", departmentCode: "CSA", hod: "Dr A" });

  const res = await request(app)
    .get(`/api/v1/departments/${created.body.data.id}`)
    .set({ ...bearer(token), ...tenantHeader(tenantB._id) });

  assert.equal(res.status, 404);
});

test("GET /api/v1/departments — invalid tenant id returns 400", async () => {
  const admin = await seedAdmin();
  const res = await request(app)
    .get("/api/v1/departments")
    .set({ ...bearer(generateAccessToken(admin._id)), "X-Tenant-ID": "not-an-id" });
  assert.equal(res.status, 400);
});

test("GET /api/v1/departments — unknown tenant returns 404", async () => {
  const admin = await seedAdmin();
  const res = await request(app)
    .get("/api/v1/departments")
    .set({ ...bearer(generateAccessToken(admin._id)), "X-Tenant-ID": "000000000000000000000000" });
  assert.equal(res.status, 404);
});

test("GET /api/v1/departments — inactive tenant returns 403", async () => {
  const admin = await seedAdmin();
  const tenant = await Tenant.create({ name: "College A", code: "COLA", status: "Inactive" });
  const res = await request(app)
    .get("/api/v1/departments")
    .set({ ...bearer(generateAccessToken(admin._id)), "X-Tenant-ID": String(tenant._id) });
  assert.equal(res.status, 403);
});
