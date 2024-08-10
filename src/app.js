import express from "express";
import bodyParser from "body-parser";
import cors from "cors"


// ** Routes imports **

import v1Routes from "./routes/v1/index.js";

// ** Express instance
const app = express();

// ** Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));

// ** Routes
app.use("/api", v1Routes);

// ** for testing puprose
app.get("/pingme", (req, res) => {
  return res.status(200).json({
    message: "pinged successfully",
  });
});

export default app;
