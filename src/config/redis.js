import IORedis from "ioredis";
import serverConfig from "./serverConfig.js";
import logger from "../utils/logger.js";

// ** bullmq needs maxRetriesPerRequest = null on its connections
const createRedisConnection = () => {
  const connection = new IORedis(serverConfig.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  connection.on("error", (error) => logger.error("redis error", error.message));
  return connection;
};

export default createRedisConnection;
