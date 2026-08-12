const config = require("../config");
const { createJobHandlers } = require("./jobHandlers");

let queueInstance = null;

const createInMemoryQueue = (handlers) => ({
  add: async (name, data) => {
    const handler = handlers[name];
    if (!handler) {
      throw new Error(`Unknown job type: ${name}`);
    }
    return { name, data, result: await handler(data) };
  },
  close: async () => {},
  usingRedis: false,
});

const createBullQueue = (handlers) => {
  const { Queue, Worker } = require("bullmq");
  const connection = { url: config.redisUrl };

  const queue = new Queue("college-erp-jobs", { connection });
  const worker = new Worker(
    "college-erp-jobs",
    async (job) => {
      const handler = handlers[job.name];
      if (!handler) throw new Error(`Unknown job type: ${job.name}`);
      return handler(job.data);
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.name} (${job?.id}) failed:`, err.message);
  });

  return {
    add: (name, data) => queue.add(name, data),
    close: () => Promise.all([queue.close(), worker.close()]),
    usingRedis: true,
  };
};

// Lazily initialised so requiring this module never connects to Redis.
const getQueue = ({ mailer } = {}) => {
  if (!queueInstance) {
    const handlers = createJobHandlers({ mailer });
    queueInstance = config.redisUrl
      ? createBullQueue(handlers)
      : createInMemoryQueue(handlers);
  }
  return queueInstance;
};

const closeQueue = async () => {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
};

module.exports = { getQueue, closeQueue };
