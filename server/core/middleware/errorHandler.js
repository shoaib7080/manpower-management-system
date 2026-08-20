// Central error handling for the whole API.
//
// Register `notFound` after all real routes, and `errorHandler` last of
// all, in server.js. Express 5 automatically forwards a rejected promise
// from an async route handler to `errorHandler` via next(err), so
// controllers just need to call next(error) in their catch blocks instead
// of resolving the response themselves.

// Catches any request that didn't match a defined route.
export const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Maps a thrown/forwarded error to the right status code and a safe
// response body. This is the one place in the app that decides what an
// error "means" — controllers shouldn't need to guess a status code for
// anything that isn't a deliberate, known business-logic response
// (auth failures, "not found", explicit 400s they already return inline).
export const errorHandler = (err, req, res, next) => {
  // If something downstream already started writing the response,
  // hand off to Express's default handler rather than trying to send twice.
  if (res.headersSent) {
    return next(err);
  }

  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong.";
  let fieldErrors;

  // Mongoose schema validation failure (required/enum/type, etc.)
  if (err.name === "ValidationError" && err.errors) {
    status = 400;
    fieldErrors = Object.values(err.errors).map((e) => e.message);
    message = "Validation failed.";
  }

  // Malformed MongoDB ObjectId in a route param (e.g. a bad :id)
  else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for '${err.path}'.`;
  }

  // MongoDB unique-index violation
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `A record with that ${field} already exists.`;
  }

  // Multer upload errors (file too large, wrong type via fileFilter, etc.)
  else if (err.name === "MulterError") {
    status = 400;
  }

  // Malformed JSON request body
  else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON in request body.";
  }

  // Anything landing here as a 5xx is, by definition, not something the
  // client could have fixed by sending different input — log the real
  // detail server-side (swap console.error for a real logger later; this
  // call site won't need to change) and never leak internals to the client.
  if (status >= 500) {
    console.error(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} →`,
      err,
    );
    message = "Something went wrong on our end.";
  }

  res
    .status(status)
    .json(fieldErrors ? { message, errors: fieldErrors } : { message });
};
