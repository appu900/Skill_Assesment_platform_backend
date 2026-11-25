import mongoose from "mongoose";
import app from "./app.js";
import serverConfig from "./config/serverConfig.js";
import makeDatabaseConnection from "./config/database.conection.js";
import startWorkers from "./workers/index.js";
import { closeQueues } from "./queues/index.js";
import ConfigService from "./service/ConfigService.js";
import { closeRenderer } from "./utils/toa/render.js";
import Scheme from "./models/Scheme.js";
import logger from "./utils/logger.js";

// ** never let one bad promise take the whole api down silently
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled promise rejection", reason);
});

// ** corporate training partners must always find a "Corporate" scheme at signup (client, 2026-11-24)
const ensureCorporateScheme = async () => {
  const exists = await Scheme.exists({ schemeType: "Corporate" });
  if (exists) return;
  await Scheme.create({
    name: "Corporate",
    code: "CORP",
    schemeType: "Corporate",
    projectType: "Corporate Training",
    state: "All India",
    pricePerStudent: 0,
    logo: "https://placehold.co/240x240/111111/ffffff/png?text=CORP",
  });
  logger.info("created the Corporate scheme");
};

const startServer = async () => {
  await makeDatabaseConnection();
  await ensureCorporateScheme().catch((error) => logger.error("could not create the Corporate scheme", error.message));

  // ** a cold cache only costs one mongodb read per setting, so a failure here must not stop the api
  await new ConfigService().warmUp().catch((error) => logger.error("configuration warm-up failed", error.message));

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
      await closeRenderer();
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
