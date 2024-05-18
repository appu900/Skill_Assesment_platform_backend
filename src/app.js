import express from "express";

import AdminRouter from "./routes/admin-routes.js";

// ** Express instance
const app = express();

// ** Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use("/api/v1", AdminRouter);

export default app;
