// ** standalone worker process: `npm run worker` (set RUN_WORKERS_IN_PROCESS=false for the api)
import makeDatabaseConnection from "./config/database.conection.js";
import startWorkers from "./workers/index.js";
import { closeQueues } from "./queues/index.js";
import mongoose from "mongoose";
import logger from "./utils/logger.js";

const start = async () => {
  await makeDatabaseConnection();
  const stopWorkers = startWorkers();
  logger.info("workers are running");

  const shutdown = async (signal) => {
    logger.info(`${signal} received, stopping workers`);
    await stopWorkers();
    await closeQueues();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((error) => {
  logger.error("worker failed to start", error);
  process.exit(1);
});
