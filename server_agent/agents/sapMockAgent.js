// mockClient.js
import { z } from "zod";
import {
  FunctionTool,
  LlmAgent,
  Runner,
  InMemorySessionService,
} from "@google/adk";

// 1. SAP asset tool (mock)
const getSapAssetTool = new FunctionTool({
  name: "get_sap_asset_location",
  description: "Fetches GPS coordinates and status for an SAP Asset ID.",
  parameters: z.object({
    assetId: z.string().describe("The SAP Asset ID"),
  }),
  execute: async ({ assetId }) => {
    console.log(`[MockClient] Querying SAP asset: ${assetId}`);
    return {
      assetId: assetId || "PUMP-101",
      status: "Needs Maintenance",
      latitude: 34.0522,
      longitude: -118.2437,
      type: "High-Pressure Water Pump",
    };
  },
});

// 2. Agent definition
const gisAgent = new LlmAgent({
  name: "gis_adk_assistant",
  model: "gemini-2.5-flash",
  instruction: `You are an enterprise GIS AI Assistant.
When asked about an SAP asset:
1. Call get_sap_asset_location to fetch coordinates.
2. Provide a concise summary including the asset status and coordinates.`,
  tools: [getSapAssetTool],
});

// 3. Session service + runner
const APP_NAME = "gis-app";
const sessionService = new InMemorySessionService();

const runner = new Runner({
  appName: APP_NAME,
  agent: gisAgent,
  sessionService: sessionService,
});

// 4. Helper for sessions
async function ensureSession(appName, userId, sessionId) {
  const existing = await sessionService.getSession({ appName, userId, sessionId });
  if (!existing) {
    console.log(`[MockClient Session] Creating new session: ${sessionId} for user: ${userId}`);
    await sessionService.createSession({ appName, userId, sessionId });
  }
}

// Export what the integrator needs
export { runner, ensureSession, APP_NAME, gisAgent, sessionService };