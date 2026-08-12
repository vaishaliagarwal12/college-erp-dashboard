const mongoose = require("mongoose");
const config = require("./index");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
