import app from "./app.js";
import makeDatabaseConnection from "./config/database.conection.js";

// ** function to start server
const startServer = async () => {
  try {
    await makeDatabaseConnection(); 
    app.listen(5000, () => {
      console.log("Server is running on port 3000");
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
