import app from "./app.js";
import makeDatabaseConnection from "./config/database.conection.js";

import sendEmail from "./service/email-service.js";
import TrainingPartnerRepository from "./repository/TrainingPartner-Repository.js";

// ** function to start server
const startServer = async () => {
  try {
    await makeDatabaseConnection();
    app.listen(8000, async () => {
      console.log("Server is running on port 8000");

      

      // sendEmail(
      //   "pabitrasundardakua@gmail.com",
      //   "justajit33@gmail.com",
      //   "Test Email",
      //   "hello ajit from skill assesment backend"
      // );
    });

  } catch (error) {
    console.log(error);
  }
};

startServer();
