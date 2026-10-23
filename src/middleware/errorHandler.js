import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { errors as vineErrors } from "@vinejs/vine";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";
import serverConfig from "../config/serverConfig.js";

const notFound = (req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// ** single place that turns thrown errors into http responses
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let details;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof vineErrors.E_VALIDATION_ERROR) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation failed";
    details = err.messages;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Validation failed";
    details = Object.fromEntries(
      Object.entries(err.errors).map(([field, error]) => [field, error.message])
    );
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(", ") || "a unique field"}`;
  } else if (err?.type === "entity.parse.failed") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Malformed JSON body";
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    // ** "error" is kept because the frontend reads it, internal details are hidden in production
    error:
      statusCode >= 500 && serverConfig.NODE_ENV === "production" ? message : err.message,
    ...(details ? { details } : {}),
  });
};

export { notFound, errorHandler };
