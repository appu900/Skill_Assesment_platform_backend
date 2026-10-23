import mongoose from "mongoose";
import app from "./app.js";
import serverConfig from "./config/serverConfig.js";
import makeDatabaseConnection from "./config/database.conection.js";
import startWorkers from "./workers/index.js";
import { closeQueues } from "./queues/index.js";
import logger from "./utils/logger.js";

// ** never let one bad promise take the whole api down silently
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled promise rejection", reason);
});

const startServer = async () => {
  await makeDatabaseConnection();

  const stopWorkers = serverConfig.RUN_WORKERS_IN_PROCESS ? startWorkers() : null;

  const server = app.listen(serverConfig.PORT, () => {
    logger.info(`Server is running on port ${serverConfig.PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, closing http server`);
    server.close(async () => {
      if (stopWorkers) {
        await stopWorkers();
      }
      await closeQueues();
      await mongoose.connection.close();
      process.exit(0);
    });
    // ** force exit if connections do not close in time
    setTimeout(() => process.exit(1), 15000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error) => {
  logger.error("server failed to start", error);
  process.exit(1);
});
