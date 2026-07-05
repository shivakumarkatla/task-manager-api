// Catches requests to routes that don't exist and forwards a
// 404 error to the errorHandler below.
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler. Every error thrown anywhere in the app
// (via asyncHandler or next(err)) ends up here, keeping error responses
// consistent across the entire API.
// NOTE: The unused `next` parameter is required — Express identifies
// error-handling middleware by its 4-argument signature.
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose throws this when an :id param isn't a valid ObjectId.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose throws this when a unique index (e.g. email) is violated.
  // Fix #6 — guard against err.keyValue being undefined on older drivers.
  if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'Field';
    message = `${field} already exists`;
  }

  // Mongoose schema validation errors (e.g. missing required field).
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose the stack trace outside production for debugging.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
