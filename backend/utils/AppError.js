// An error with an HTTP status code. Controllers throw it; the error middleware
// turns it into a clean JSON response.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export default AppError;
