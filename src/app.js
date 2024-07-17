import express from "express";
import bodyParser from "body-parser";


import v1Routes from "./routes/v1/index.js";

// ** Express instance
const app = express();

// ** Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/v1", v1Routes);

export default app;
