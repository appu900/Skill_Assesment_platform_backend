import express from "express";

import AdminRouter from "./routes/admin-routes.js";
import TrainingPartner from "./routes/trainingPartner-routes.js";

// ** Express instance
const app = express();

// ** Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use("/api/v1/admin", AdminRouter);
app.use("/api/v1/tp", TrainingPartner);

app.get("/", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

export default app;
