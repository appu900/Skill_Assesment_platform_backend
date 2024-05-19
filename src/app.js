import express from "express";

import AdminRouter from "./routes/v1/admin-routes.js";
import TrainingPartnerRoutes from "./routes/v2/TrainingPartner-routes.js";

// ** Express instance
const app = express();

// ** Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use("/api/v1", AdminRouter);
app.use("/api/v2", TrainingPartnerRoutes);

export default app;
