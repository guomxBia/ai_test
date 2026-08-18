// combinedAgent.js
// C:\Users\Mingxin.Guo\Projects\test\adk\server\agents\combinedAgent.js
//
// A single agent that can use BOTH transports at once:
//   - FederalGisHttpMcpClient  -> remote ArcGIS feature layers over HTTP/SSE
//   - LocalToolsStdioMcpClient  -> local files / local SQLite DB over stdio
//
// This lets one conversation ask about power plants (remote) AND local
// wells/files (local) without switching ACTIVE_CLIENT.

import { z } from "zod";
import {
  FunctionTool,
  LlmAgent,
  Runner,
  InMemorySessionService,
} from "@google/adk";
import { FederalGisHttpMcpClient } from "../clients/FederalGisHttpMcpClient.js";
import { LocalToolsStdioMcpClient } from "../clients/LocalToolsStdioMcpClient.js";

const arcgisHttp = new FederalGisHttpMcpClient();
const localMcp = new LocalToolsStdioMcpClient();

process.once("SIGTERM", () => {
  localMcp.close();
  arcgisHttp.close?.();
});
process.once("SIGINT", () => {
  localMcp.close();
  arcgisHttp.close?.();
});

// ---------------------------------------------------------------------------
// Helper for local (stdio) tools: parse the JSON text result
// ---------------------------------------------------------------------------
async function callLocalTool(name, args) {
  const response = await localMcp.callTool(name, args);
  const content = response.content || [];
  const text = content[0]?.text || "";
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ---------------------------------------------------------------------------
// Remote tool: ArcGIS power plants (HTTP/SSE)
// ---------------------------------------------------------------------------

const queryPowerPlantsTool = new FunctionTool({
  name: "query_power_plants_us_eia",
  description:
    "Query power plants from the EIA feature layer via the remote ArcGIS HTTP/SSE MCP server.",
  parameters: z.object({
    state: z.string().optional().describe("State name or abbreviation, e.g. 'Michigan' or 'CO'."),
    plantNameLike: z.string().optional().describe("Optional partial plant name filter."),
    maxFeatures: z.number().optional().describe("Maximum number of records to return."),
  }),
  execute: async ({ state, plantNameLike, maxFeatures }) => {
    console.log(
      `[CombinedAgent] query_power_plants_us_eia (HTTP) state=${state}, plantNameLike=${plantNameLike}, maxFeatures=${maxFeatures}`
    );

    let data;
    try {
      data = await arcgisHttp.queryPowerPlants({
        state,
        plantNameLike,
        maxFeatures: maxFeatures ?? 5,
      });
    } catch (err) {
      console.error("[CombinedAgent] ArcGIS HTTP call failed:", err);
      return { message: `Error querying power plants: ${err.message}`, firstLocation: null };
    }

    const features = data?.features;
    const whereDescription =
      data?.where ||
      [state ? `state=${state}` : null, plantNameLike ? `plantNameLike=${plantNameLike}` : null]
        .filter(Boolean)
        .join(", ") ||
      "the U.S.";

    if (!features || !Array.isArray(features) || features.length === 0) {
      return { message: `No power plants found for ${whereDescription}.`, firstLocation: null };
    }

    const plants = features.slice(0, 5).map((f, i) => {
      const a = f.attributes || {};
      return {
        index: i + 1,
        name: a.Plant_Name || "Unknown name",
        fuel: a.PrimSource || "Unknown fuel",
        latitude: a.Latitude,
        longitude: a.Longitude,
      };
    });

    const lines = plants.map(
      (p) =>
        `${p.index}. ${p.name} (fuel: ${p.fuel}) at (${p.latitude?.toFixed?.(4)}, ${p.longitude?.toFixed?.(4)})`
    );

    const summary = `Found ${plants.length} power plants for ${whereDescription}:\n` + lines.join("\n");

    const first = plants[0];
    const firstLocation =
      first && first.latitude != null && first.longitude != null
        ? { latitude: first.latitude, longitude: first.longitude, label: first.name }
        : null;

    return { message: summary, firstLocation };
  },
});

// ---------------------------------------------------------------------------
// Local tools (stdio)
// ---------------------------------------------------------------------------

const readLocalFileTool = new FunctionTool({
  name: "read_local_file",
  description: "Read a text file from the server's local sandbox folder (local_data/).",
  parameters: z.object({
    fileName: z.string().describe("Name of the file inside local_data/, e.g. 'notes.txt'."),
  }),
  execute: async ({ fileName }) => {
    console.log(`[CombinedAgent] read_local_file fileName=${fileName}`);
    const result = await callLocalTool("read_local_file", { fileName });
    if (result.error) return { message: `Error reading file: ${result.error}` };
    return { message: `Contents of ${result.fileName}:\n${result.content}` };
  },
});

const listLocalDirectoryTool = new FunctionTool({
  name: "list_local_directory",
  description: "List files and folders inside the server's local sandbox folder (local_data/).",
  parameters: z.object({}),
  execute: async () => {
    console.log("[CombinedAgent] list_local_directory");
    const result = await callLocalTool("list_local_directory", {});
    if (result.error) return { message: `Error listing directory: ${result.error}` };
    if (!result.items || result.items.length === 0) {
      return { message: `No files found in ${result.folder}.` };
    }
    const lines = result.items.map((item, i) => `${i + 1}. ${item.name} (${item.type})`);
    return { message: `Found ${result.items.length} item(s) in ${result.folder}:\n${lines.join("\n")}` };
  },
});

const getServerTimeTool = new FunctionTool({
  name: "get_server_time",
  description: "Return the current date/time on the machine running the local MCP server.",
  parameters: z.object({}),
  execute: async () => {
    console.log("[CombinedAgent] get_server_time");
    const result = await callLocalTool("get_server_time", {});
    return { message: `Server time is ${result.local} (ISO: ${result.iso}).` };
  },
});

const queryLocalWellsTool = new FunctionTool({
  name: "query_local_wells",
  description: "Query wells from the project's local SQLite database (gis.db).",
  parameters: z.object({
    limit: z.number().optional().describe("Max number of wells to return. Defaults to 10."),
  }),
  execute: async ({ limit }) => {
    console.log(`[CombinedAgent] query_local_wells limit=${limit}`);
    const result = await callLocalTool("query_local_wells", { limit: limit ?? 10 });

    if (result.error) return { message: `Error querying wells: ${result.error}`, firstLocation: null };
    if (!result.wells || result.wells.length === 0) {
      return { message: "No wells found in the local database.", firstLocation: null };
    }

    const lines = result.wells.map(
      (w, i) => `${i + 1}. ${w.name} at (${w.latitude.toFixed(4)}, ${w.longitude.toFixed(4)})`
    );

    const first = result.wells[0];
    const firstLocation =
      first && first.latitude != null && first.longitude != null
        ? { latitude: first.latitude, longitude: first.longitude, label: first.name }
        : null;

    return { message: `Found ${result.wells.length} well(s):\n${lines.join("\n")}`, firstLocation };
  },
});

// ---------------------------------------------------------------------------
// Agent — has both remote and local tools available at once
// ---------------------------------------------------------------------------

const gisAgent = new LlmAgent({
  name: "combined_gis_assistant",
  model: "gemini-2.5-flash",
  instruction: `
You are a GIS AI Assistant with access to both REMOTE and LOCAL data sources.

REMOTE (ArcGIS, via HTTP/SSE):
- Use "query_power_plants_us_eia" when the user asks about power plants in the
  United States or a specific state. Use 'state' and optionally 'plantNameLike'.

LOCAL (this machine, via stdio):
- Use "query_local_wells" when the user asks about wells in the local database.
- Use "read_local_file" when the user asks to read a specific local file.
- Use "list_local_directory" when the user asks what local files exist.
- Use "get_server_time" when the user asks what time it is on the server.

Always pick the tool that matches what the user is actually asking about.
After a tool returns { message, firstLocation? }, return the "message" as
plain text to the user.
`,
  tools: [
    queryPowerPlantsTool,
    queryLocalWellsTool,
    readLocalFileTool,
    listLocalDirectoryTool,
    getServerTimeTool,
  ],
});

const APP_NAME = "combined-gis-app";
const sessionService = new InMemorySessionService();

const runner = new Runner({
  appName: APP_NAME,
  agent: gisAgent,
  sessionService: sessionService,
});

async function ensureSession(appName, userId, sessionId) {
  const existing = await sessionService.getSession({ appName, userId, sessionId });
  if (!existing) {
    console.log(`[CombinedAgent Session] Creating new session: ${sessionId} for user: ${userId}`);
    await sessionService.createSession({ appName, userId, sessionId });
  }
}

export { runner, ensureSession, APP_NAME, gisAgent, sessionService };