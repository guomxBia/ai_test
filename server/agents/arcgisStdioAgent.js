// arcgisStdioAgent.js
//C:\Users\Mingxin.Guo\Projects\test\adk\server\agents\arcgisStdioAgent.js
import { z } from "zod";
import {
  FunctionTool,
  LlmAgent,
  Runner,
  InMemorySessionService,
} from "@google/adk";
import { arcgisStdioMcpClient } from "../clients/arcgisStdioMcpClient.js";

const arcgisMcp = new arcgisStdioMcpClient();

process.once('SIGTERM', () => arcgisMcp.close());
process.once('SIGINT', () => arcgisMcp.close());

const queryPowerPlantsTool = new FunctionTool({
  name: "query_power_plants_us_eia",
  description:
    "Query power plants from the EIA feature layer via the ArcGIS MCP server.",
  parameters: z.object({
    state: z.string().optional().describe("State name or abbreviation, e.g. 'Michigan' or 'CO'."),
    plantNameLike: z.string().optional().describe("Optional partial plant name filter."),
    maxFeatures: z.number().optional().describe("Maximum number of records to return."),
  }),
  execute: async ({ state, plantNameLike, maxFeatures }) => {
    console.log(
      `[ArcgisClient Tool] query_power_plants_us_eia called with state=${state}, plantNameLike=${plantNameLike}, maxFeatures=${maxFeatures}`
    );

    const response = await arcgisMcp.callTool("query_power_plants_us_eia", {
      state,
      plantNameLike,
      maxFeatures: maxFeatures ?? 5,
    });

    const content = response.content || [];
    const text = content[0]?.text || "";

    console.log("[ArcgisClient Tool] MCP raw text:", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("[ArcgisClient Tool] Failed to parse JSON; returning raw text.");
      return {
        message: text || "No data returned from MCP.",
        firstLocation: null,
      };
    }

    if (!parsed.features || !Array.isArray(parsed.features) || parsed.features.length === 0) {
      return {
        message: `No power plants found for state=${state || "ANY"}, plantNameLike=${plantNameLike || "ANY"}.`,
        firstLocation: null,
      };
    }

    const plants = parsed.features.slice(0, 5).map((f, i) => {
      const attrs = f.attributes || {};
      return {
        index: i + 1,
        name: attrs.Plant_Name || "Unknown name",
        fuel: attrs.PrimSource || "Unknown fuel",
        latitude: attrs.Latitude,
        longitude: attrs.Longitude,
      };
    });

    const lines = plants.map(
      (p) =>
        `${p.index}. ${p.name} (fuel: ${p.fuel}) at (${p.latitude?.toFixed?.(4)}, ${p.longitude?.toFixed?.(4)})`
    );

    const summary = `Found ${plants.length} power plants in ${state || "the U.S."}:\n` +
      lines.join("\n");

    const first = plants[0];
    const firstLocation =
      first && first.latitude != null && first.longitude != null
        ? {
            latitude: first.latitude,
            longitude: first.longitude,
            label: first.name,
          }
        : null;

    return {
      message: summary,
      firstLocation,
    };
  },
});

const gisAgent = new LlmAgent({
  name: "gis_arcgis_assistant",
  model: "gemini-2.5-flash",
  instruction: `
You are a GIS AI Assistant.

When the user asks about power plants in the United States or in a specific state:
1. Call the tool "query_power_plants_us_eia".
2. Use the 'state' parameter based on the user's question (e.g., 'Michigan' for Michigan).
3. Use 'plantNameLike' only if the user mentions part of the plant name.
4. Use maxFeatures=5 unless the user asks for a different number.

After the tool returns { message, firstLocation }:
- Return the "message" as plain text to the user.
`,
  tools: [queryPowerPlantsTool],
});

const APP_NAME = "gis-arcgis-app";
const sessionService = new InMemorySessionService();

const runner = new Runner({
  appName: APP_NAME,
  agent: gisAgent,
  sessionService: sessionService,
});

async function ensureSession(appName, userId, sessionId) {
  const existing = await sessionService.getSession({ appName, userId, sessionId });
  if (!existing) {
    console.log(`[ArcgisClient Session] Creating new session: ${sessionId} for user: ${userId}`);
    await sessionService.createSession({ appName, userId, sessionId });
  }
}

export { runner, ensureSession, APP_NAME, gisAgent, sessionService };