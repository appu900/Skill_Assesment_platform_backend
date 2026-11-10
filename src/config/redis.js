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

// ** cache connection: fails fast instead of queueing commands while redis is down,
// ** so callers can fall back to mongodb (bullmq keeps its own blocking connections above)
let cacheConnection = null;
export const getCacheConnection = () => {
  if (!cacheConnection) {
    cacheConnection = new IORedis(serverConfig.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });
    cacheConnection.on("error", (error) => logger.error("redis cache error", error.message));
  }
  return cacheConnection;
};
