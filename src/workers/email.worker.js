import { Worker } from "bullmq";
import sender from "../config/emailconfig.js";
import createRedisConnection from "../config/redis.js";
import { QUEUE_NAMES } from "../queues/index.js";
import logger from "../utils/logger.js";

const startEmailWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { from, to, subject, text } = job.data;
      await sender.sendMail({ from, to, subject, text });
    },
    { connection: createRedisConnection(), concurrency: 5 }
  );

  worker.on("failed", (job, error) => {
    logger.error(`email job ${job?.id} to ${job?.data?.to} failed`, error.message);
  });

  return worker;
};

export default startEmailWorker;
