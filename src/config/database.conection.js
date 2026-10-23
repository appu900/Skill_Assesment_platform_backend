import mongoose from "mongoose";
import initializeSequence from "./counterConfig.js";
import intializeCertificateSequnce from "./certificateSeq.js";
import initializeStudentCounter from "./studentCounter.js";
import serverConfig from "./serverConfig.js";
import logger from "../utils/logger.js";

async function makeDatabaseConnection() {
  await mongoose.connect(serverConfig.MONGO_URI);
  await initializeSequence();
  await intializeCertificateSequnce();
  await initializeStudentCounter();
  logger.info("database is connected");
}

export default makeDatabaseConnection;
