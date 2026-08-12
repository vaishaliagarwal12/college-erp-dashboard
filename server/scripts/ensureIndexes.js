const mongoose = require("mongoose");
const config = require("../config");
const ensureIndexes = require("../utils/ensureIndexes");

const run = async () => {
  await mongoose.connect(config.mongoUri);
  console.log("Ensuring MongoDB indexes...");
  await ensureIndexes();
  console.log("All indexes ensured.");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Index creation failed:", err);
  process.exit(1);
});
