// src/backend/middleware/errorHandler.js
export class AppError extends Error {
  constructor(message, type = "GeneralError", statusCode = 500) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const errorType = err.type || "GeneralError";

  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal server error"
        : err.message,
    type: errorType,
  });
};
