import app from "./app.js";
import makeDatabaseConnection from "./config/database.conection.js";
import "dotenv/config";

const port = process.env.PORT || 5000;

// ** function to start server
const startServer = async () => {
  try {
    await makeDatabaseConnection();
    app.listen(port, async () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
