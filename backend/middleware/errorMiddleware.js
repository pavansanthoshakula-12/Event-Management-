// 404 for unknown routes
export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const duplicateMessages = {
  email: "An account with this email already exists",
  rollNumber: "An account with this roll number already exists",
  student: "You are already registered for this event",
  event: "You are already registered for this event",
};

// Central error handler: every error ends up here and becomes consistent JSON.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";
  let errors;

  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === "ValidationError") {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0]?.message || "Validation failed";
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = duplicateMessages[field] || "Duplicate value. This record already exists";
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Your session has expired. Please log in again.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body contains invalid JSON";
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") message = "Something went wrong on the server";
  }

  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};
