import mongoose from "mongoose";
import initializeSequence from "./counterConfig.js";
import "dotenv/config";
import intializeCertificateSequnce from "./certificateSeq.js";
import initializeStudentCounter from "./studentCounter.js";

const DatabaseUrl = process.env.MONGO_URI;


async function makeDatabaseConnection() {
  try {
    await mongoose.connect(DatabaseUrl);
    await initializeSequence();
    await intializeCertificateSequnce();
    await initializeStudentCounter();
    
    console.log("database is connected");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export default makeDatabaseConnection;


