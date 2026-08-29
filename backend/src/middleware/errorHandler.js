export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Route not found", errors: [] });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
    errors: err.errors || [],
  });
}
