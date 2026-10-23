import "dotenv/config";

// ** every secret / environment specific value is read from here, never hardcode them

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const serverConfig = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",

  EMAIL_ID: process.env.EMAIL_ID,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,

  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  // ** run the bullmq workers inside the api process (set false when running `npm run worker` separately)
  RUN_WORKERS_IN_PROCESS: process.env.RUN_WORKERS_IN_PROCESS !== "false",

  // ** comma separated list of allowed frontend origins, empty = allow all
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [],

  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  // ** "public-read" keeps the current frontend working, switch to "private" once signed urls are used
  S3_OBJECT_ACL: process.env.S3_OBJECT_ACL || "public-read",
  MAX_UPLOAD_SIZE_MB: Number(process.env.MAX_UPLOAD_SIZE_MB || 10),
};

export default serverConfig;
