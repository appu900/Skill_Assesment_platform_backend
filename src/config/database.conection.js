import mongoose from "mongoose";

async function makeDatabaseConnection() {
  try {
    await mongoose.connect("mongodb+srv://msubham193:sonu@cluster0.62xyd.mongodb.net/prisma-skillassement?retryWrites=true&w=majority");
    console.log("database connected");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

export default makeDatabaseConnection;


