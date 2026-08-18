// index.js (backend)

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import router from "./routes.js";
import { localToolsClient } from "./clients/localToolsClient.js";

const app = express();

app.use(cors());
app.use(express.json());

// Mount all API routes.
app.use("/", router);

const server = app.listen(PORT, () => {
  console.log("========================================");
  console.log(`GIS Agent Host running at http://localhost:${PORT}`);
  console.log(`Chat endpoint:   http://localhost:${PORT}/api/chat`);
  console.log(`Wells endpoint:  http://localhost:${PORT}/api/loadwells`);
  console.log("========================================");
});

// Prevent a second SIGINT/SIGTERM from starting shutdown twice.
let isShuttingDown = false;

/**
 * Gracefully stop the HTTP server and the shared local stdio MCP client.
 *
 * Order:
 * 1. Stop accepting new HTTP connections.
 * 2. Wait for in-flight HTTP requests to complete.
 * 3. Close the shared MCP client and its spawned child process.
 * 4. Exit the Node process.
 */
function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.warn(
      `[index.js] ${signal} received while shutdown is already in progress.`
    );
    return;
  }

  isShuttingDown = true;

  console.log(`[index.js] Received ${signal}, shutting down...`);

  // Failsafe only. It prevents an indefinitely hung shutdown.
  // 10 seconds is safer than 3 seconds if an MCP request or HTTP response
  // is still completing.
  const forceExitTimer = setTimeout(() => {
    console.error("[index.js] Forced exit after graceful-shutdown timeout.");
    process.exit(1);
  }, 10_000);

  // .unref() means this timer alone does not keep Node alive.
  forceExitTimer.unref();

  // server.close() stops new HTTP connections and waits for active requests.
  server.close(async (httpError) => {
    if (httpError) {
      console.error("[index.js] HTTP server close failed:", httpError);
      clearTimeout(forceExitTimer);
      process.exit(1);
      return;
    }

    console.log("[index.js] HTTP server closed.");

    try {
      // Close once here—not inside individual routes.
      // This terminates the local MCP child process cleanly.
      await localToolsClient.close();
      console.log("[index.js] Local stdio MCP client closed.");

      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (mcpError) {
      console.error("[index.js] Failed to close local MCP client:", mcpError);

      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  });
}

process.once("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

process.once("SIGINT", () => {
  gracefulShutdown("SIGINT");
});