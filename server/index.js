// index.js (backend)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import router from "./routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Mount all API routes
app.use("/", router);

const server = app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`GIS Agent Host running at http://localhost:${PORT}`);
  console.log(`Chat endpoint:   http://localhost:${PORT}/api/chat`);
  console.log(`Wells endpoint:  http://localhost:${PORT}/api/loadwells`);
  console.log(`========================================`);
});

// Give any lazily-loaded modules (e.g. arcgisStdioAgent.js) a chance to
// register their own cleanup on SIGTERM/SIGINT *before* we force-exit.
// We do NOT call process.exit() here directly — that would short-circuit
// any other SIGTERM/SIGINT listeners registered later (e.g. the stdio
// MCP client's child-process cleanup), since Node runs listeners for the
// same signal in registration order and exit() is synchronous/immediate.
function gracefulShutdown(signal) {
  console.log(`[index.js] Received ${signal}, shutting down HTTP server...`);
  server.close(() => {
    console.log("[index.js] HTTP server closed.");
    process.exit(0);
  });

  // Failsafe: force-exit if something hangs (e.g. a socket won't close)
  setTimeout(() => {
    console.warn("[index.js] Forced exit after timeout.");
    process.exit(1);
  }, 3000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));