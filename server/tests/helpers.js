const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// MUST be called before requiring ../app so config reads test values
const setupTestEnv = () => {
  process.env.MONGOMS_VERSION = "7.0.14";
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret-key";
  process.env.JWT_EXPIRE = "1h";
  process.env.MONGO_URI = "mongodb://localhost/test";
  process.env.RATE_LIMIT_MAX = "1000";
  process.env.AUTH_RATE_LIMIT_MAX = "1000";
  process.env.LOCKOUT_MAX_ATTEMPTS = "3";
  process.env.LOCKOUT_WINDOW_MS = "60000";
  process.env.PASSWORD_HISTORY_LENGTH = "3";
  process.env.PASSWORD_MAX_AGE_DAYS = "0";
  process.env.REQUIRE_EMAIL_VERIFICATION = "false";
  process.env.WORKLOAD_MAX_WEEKLY_HOURS = "12";
};

const startDb = async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  return mongo;
};

const stopDb = async (mongo) => {
  await mongoose.disconnect();
  await mongo.stop();
};

const clearDb = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

module.exports = { setupTestEnv, startDb, stopDb, clearDb };
