import mongoose from "mongoose";

async function makeDatabaseConnection() {
  try {
    await mongoose.connect("mongodb://localhost/assesment");
    console.log("database connected");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export default makeDatabaseConnection;
