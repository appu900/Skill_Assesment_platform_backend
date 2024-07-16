import mongoose from "mongoose";
import initializeSequence from "./counterConfig.js";


async function makeDatabaseConnection() {
  try {
    await mongoose.connect(
      "mongodb+srv://msubham193:sonu@cluster0.62xyd.mongodb.net/prisma-skillassement?retryWrites=true&w=majority"
    );
    await initializeSequence()
    console.log("database is connected");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export default makeDatabaseConnection;
