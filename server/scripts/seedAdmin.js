const mongoose = require("mongoose");
const config = require("../config");
const User = require("../models/User");

const run = async () => {
  await mongoose.connect(config.mongoUri);

  const name = process.env.ADMIN_NAME || "Super Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const role = process.env.ADMIN_ROLE || "SuperAdmin";

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env");
    process.exit(1);
  }

  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`ℹ️  User with email ${email} already exists. Skipping.`);
  } else {
    await User.create({ name, email, password, role, emailVerified: true });
    console.log(`✅ ${role} created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
