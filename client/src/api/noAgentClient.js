// src/api/noAgentClient.js
//
// Matches the actual response contract of server/routes/queryRoutes.js:
//
// POST /api/query
// body: { prompt, provider: "ollama" | "gemini", target?: "niogems" | "usgs" }
//
// Response shapes:
//   mock         -> { provider, target, toolName, args, data }
//   gemini + tool  -> { provider, type: "tool_call", toolName, args, data }
//   gemini + text  -> { provider, type: "text", text }
//
import { NO_AGENT_SERVER_URL } from "../config.js";

export async function queryNoAgentServer({ prompt, provider, target }) {
  const body = { prompt, provider };
  if (provider === "mock") {
    body.target = target;
  }

  const response = await fetch(`${NO_AGENT_SERVER_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Server returned HTTP ${response.status}`);
  }

  return payload;
}

/**
 * Try common shapes: {data: [...]}, {wells: [...]}, {turbines: [...]},
 * {features: [...]}, or a bare array. Mirrors the original vanilla-JS
 * extractRecords() so both UIs stay consistent.
 */
export function extractRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.wells)) return data.wells;
  if (Array.isArray(data?.turbines)) return data.turbines;
  if (Array.isArray(data?.features)) {
    return data.features.map((f) => f.attributes ?? f);
  }
  return [];
}

// USGS turbine records carry xlong/ylat; Niogems wells have no coordinates.
export function findFirstLocation(records) {
  const first = records[0];
  if (first && typeof first.xlong === "number" && typeof first.ylat === "number") {
    return { latitude: first.ylat, longitude: first.xlong, label: first.t_manu || "Turbine" };
  }
  return null;
}