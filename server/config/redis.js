const { Redis } = require("ioredis");
const config = require("./index");

let redis = null;

const createRedisClient = () => {
  if (!config.redisUrl) return null;
  const client = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
  });
  client.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
  client.connect().catch(() => {
    console.warn("Redis unavailable — continuing without caching / queue.");
  });
  return client;
};

const getRedis = () => {
  if (!redis) redis = createRedisClient();
  return redis;
};

const isRedisReady = () => {
  const client = getRedis();
  return Boolean(client && client.status === "ready");
};

const closeRedis = async () => {
  if (redis) {
    await redis.quit().catch(() => {});
    redis = null;
  }
};

module.exports = { getRedis, isRedisReady, closeRedis };
