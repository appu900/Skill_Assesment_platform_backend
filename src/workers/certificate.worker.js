import { Worker } from "bullmq";
import createRedisConnection from "../config/redis.js";
import { QUEUE_NAMES, JOB_NAMES } from "../queues/index.js";
import CertificateService from "../service/CertificateService.js";
import logger from "../utils/logger.js";

const startCertificateWorker = () => {
  const certificateService = new CertificateService();

  const worker = new Worker(
    QUEUE_NAMES.CERTIFICATE,
    async (job) => {
      if (job.name === JOB_NAMES.PUBLISH_EXAM_CERTIFICATES) {
        return certificateService.issueCertificatesForExam(job.data.examId, job);
      }
      throw new Error(`Unknown certificate job ${job.name}`);
    },
    { connection: createRedisConnection(), concurrency: 2 }
  );

  worker.on("completed", (job, result) => {
    logger.info(`certificate job ${job.id} completed`, result);
  });

  worker.on("failed", async (job, error) => {
    logger.error(`certificate job ${job?.id} failed`, error.message);
    // ** mark the exam as failed only when no retries are left, so admin can publish again
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      await certificateService.markPublishFailed(job.data.examId, error.message);
    }
  });

  return worker;
};

export default startCertificateWorker;
