import mongoose from "mongoose";
import initializeSequence from "./counterConfig.js";
import "dotenv/config";

const DatabaseUrl = process.env.MONGO_URI;


async function makeDatabaseConnection() {
  try {
    await mongoose.connect(
      DatabaseUrl
    );
    await initializeSequence()
    console.log("database is connected");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export default makeDatabaseConnection;



