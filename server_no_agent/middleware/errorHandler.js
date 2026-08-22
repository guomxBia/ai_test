export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  console.error("[server] Request failed:", error);

  if (res.headersSent) {
    return next(error);
  }

  const message = error instanceof Error ? error.message : "Internal server error.";

  // Most known application errors are validation/config/provider errors.
  // Avoid exposing a stack trace or raw upstream response to the browser.
  const clientError =
    message.includes("must be") ||
    message.includes("not allowed") ||
    message.includes("not registered") ||
    message.includes("Unsupported provider") ||
    message.includes("not in GEMINI_ALLOWED_MODELS");

  res.status(clientError ? 400 : 500).json({
    error: clientError ? message : "Query failed. Check server logs for details.",
  });
}