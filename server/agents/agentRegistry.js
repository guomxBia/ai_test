// agentRegistry.js
import { ACTIVE_CLIENT } from "../config.js";
// Possible values: "mock", "arcgis-http", "arcgis-stdio"

console.log(`[AgentRegistry] ACTIVE_CLIENT = "${ACTIVE_CLIENT}"`);

let cached = null;

async function loadActive() {
  if (cached) return cached;

  switch (ACTIVE_CLIENT) {
    case "arcgis-http":
      console.log("[AgentRegistry] Loading arcgisHttpAgent (HTTP/SSE transport)...");
      cached = await import("./arcgisHttpAgent.js");
      break;
    case "arcgis-stdio":
      console.log("[AgentRegistry] Loading arcgisStdioAgent (stdio child-process transport)...");
      cached = await import("./arcgisStdioAgent.js");
      break;
    case "mock":
    default:
      console.log("[AgentRegistry] Loading sapMockAgent (mock, no external MCP)...");
      cached = await import("./sapMockAgent.js");
      break;
  }
  return cached;
}

export async function getRunner() {
  const mod = await loadActive();
  return mod.runner;
}

export async function getEnsureSession() {
  const mod = await loadActive();
  return mod.ensureSession;
}

export async function getAppName() {
  const mod = await loadActive();
  return mod.APP_NAME;
}

export async function getAgent() {
  const mod = await loadActive();
  return mod.gisAgent;
}