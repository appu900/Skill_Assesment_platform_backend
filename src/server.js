import app from "./app.js";
import makeDatabaseConnection from "./config/database.conection.js";
import os from "os";
import cluster from "cluster";
import "dotenv/config";

const port = process.env.PORT || 5000;

import MarkService from "./service/Mark-Service.js";
const service = new MarkService();

// ** clusteting for multi-core cpu

// const totalCpus = os.cpus().length;
// const workerToSubtract = 2;
// const numWorkers = Math.max(totalCpus - workerToSubtract, 1);

// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running`);
//   for (let i = 0; i < numWorkers; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(
//       `Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`
//     );
//     // Optionally restart the worker
//     cluster.fork();
//   });
// } else {
//   const startServer = async () => {
//     try {
//       await makeDatabaseConnection();
//       app.listen(port, async () => {
//         console.log(`Server is running on port ${port}`);
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   startServer();
// }

// process.on('SIGTERM', () => {
//   console.info('SIGTERM signal received.');
//   console.log('Closing http server.');
//   server.close(() => {
//     console.log('Http server closed.');
//     process.exit(0);
//   });
// });
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
