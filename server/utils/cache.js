const { getRedis, isRedisReady } = require("../config/redis");

const cache = {
  async get(key) {
    if (!isRedisReady()) return null;
    const raw = await getRedis().get(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    if (!isRedisReady()) return;
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key) {
    if (!isRedisReady()) return;
    await getRedis().del(key);
  },

  async delPattern(pattern) {
    if (!isRedisReady()) return;
    const client = getRedis();
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(keys);
  },
};

module.exports = cache;
