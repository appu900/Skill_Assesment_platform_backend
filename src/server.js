import app from "./app.js";
import makeDatabaseConnection from "./config/database.conection.js";

// ** function to start server
const startServer = async () => {
  const PORT = 5000;
  try {
    await makeDatabaseConnection();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
