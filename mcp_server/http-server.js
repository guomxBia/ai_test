// mcp_server/http-server.js
//
// Main HTTP web server.
//
// Responsibilities:
// - Create the Express application.
// - Configure general HTTP middleware.
// - Mount MCP HTTP endpoints.
// - Mount other application routes in the future.
// - Start listening on the configured port.
//
// This file should NOT contain MCP protocol or transport logic.

import express from "express";

import { PORT } from "./config.js";
import { createMcpRouter } from "./mcp-server.js";

const app = express();

/**
 * General application middleware.
 */
app.use(express.json());

/**
 * Mount MCP endpoints.
 *
 * createMcpRouter() owns all MCP-specific HTTP/SSE behavior.
 */
app.use(createMcpRouter());

/**
 * Simple health endpoint for the web server itself.
 *
 * This is intentionally not an MCP tool or MCP endpoint.
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

/**
 * Start the real HTTP web server.
 */
app.listen(PORT, () => {
  console.log(
    "======================================================="
  );

  console.log(
    `Federal GIS server running on port ${PORT}`
  );

  console.log(
    `MCP SSE:      http://localhost:${PORT}/sse`
  );

  console.log(
    `MCP Messages: http://localhost:${PORT}/messages`
  );

  console.log(
    `Health:       http://localhost:${PORT}/health`
  );

  console.log(
    "======================================================="
  );
});