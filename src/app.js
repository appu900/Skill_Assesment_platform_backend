import express from "express";
import cors from "cors";
import helmet from "helmet";
import serverConfig from "./config/serverConfig.js";
import v1Routes from "./routes/v1/index.js";
import sanitizeInput from "./middleware/sanitize.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const corsConfig = {
  credentials: true,
  // ** only the configured frontends in production, every origin when CORS_ORIGINS is empty (local dev)
  origin: serverConfig.CORS_ORIGINS.length > 0 ? serverConfig.CORS_ORIGINS : true,
};

const app = express();

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsConfig));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitizeInput);

app.use("/api", v1Routes);

// ** health check
app.get("/pingme", (req, res) => {
  return res.status(200).json({
    message: "pinged successfully",
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
