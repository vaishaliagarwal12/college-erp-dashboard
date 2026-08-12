const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/database");
const config = require("./config");
const createSocketServer = require("./socket");
const { setIO } = require("./io");

// Connect Database
connectDB();

// Ensure schema indexes on startup (MongoDB Atlas / production)
mongoose.connection.once("open", async () => {
  if (config.isProduction) {
    try {
      const ensureIndexes = require("./utils/ensureIndexes");
      await ensureIndexes();
      console.log("MongoDB indexes ensured.");
    } catch (error) {
      console.error("Failed to ensure indexes:", error.message);
    }
  }
});

const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});

// Real-time notifications over Socket.IO
setIO(createSocketServer(server));

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    } catch (error) {
      console.error("Error during shutdown:", error.message);
    }
    try {
      const { closeRedis } = require("./config/redis");
      await closeRedis();
    } catch (error) {
      // no-op if redis is not configured
    }
    process.exit(0);
  });

  // Force exit if shutdown takes too long
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
