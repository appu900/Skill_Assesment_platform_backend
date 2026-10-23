import { StatusCodes } from "http-status-codes";

// ** an error that carries the http status code it should be answered with
class AppError extends Error {
  constructor(message, statusCode = StatusCodes.BAD_REQUEST) {
    super(message);
    this.statusCode = statusCode;
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, StatusCodes.NOT_FOUND);
  }

  static forbidden(message = "You are not allowed to perform this action") {
    return new AppError(message, StatusCodes.FORBIDDEN);
  }

  static unauthorized(message = "Invalid credentials") {
    return new AppError(message, StatusCodes.UNAUTHORIZED);
  }

  static conflict(message) {
    return new AppError(message, StatusCodes.CONFLICT);
  }
}

export default AppError;
