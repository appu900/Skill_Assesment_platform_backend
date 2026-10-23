import { Queue } from "bullmq";
import createRedisConnection from "../config/redis.js";

export const QUEUE_NAMES = {
  CERTIFICATE: "certificate",
  EMAIL: "email",
};

export const JOB_NAMES = {
  PUBLISH_EXAM_CERTIFICATES: "publish-exam-certificates",
  SEND_EMAIL: "send-email",
};

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { age: 7 * 24 * 3600 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

const connection = createRedisConnection();

const certificateQueue = new Queue(QUEUE_NAMES.CERTIFICATE, { connection, defaultJobOptions });
const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection, defaultJobOptions });

const closeQueues = async () => {
  await Promise.all([certificateQueue.close(), emailQueue.close()]);
  await connection.quit();
};

export { certificateQueue, emailQueue, closeQueues };
