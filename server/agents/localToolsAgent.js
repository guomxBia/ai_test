// localToolsAgent.js
// C:\Users\Mingxin.Guo\Projects\test\adk\server\agents\localToolsAgent.js
//
// Agent for the local-only MCP server (stdio-mcp-server.js). Demonstrates
// tools that only make sense on the machine actually running the server:
// reading a local file, listing a local folder, checking server time, and
// querying the local SQLite wells database. For remote GIS data (ArcGIS
// feature layers), use arcgisHttpAgent.js instead.

import { z } from "zod";
import {
  FunctionTool,
  LlmAgent,
  Runner,
  InMemorySessionService,
} from "@google/adk";
import { localToolsMcpClient } from "../clients/localToolsMcpClient.js";

const localMcp = new localToolsMcpClient();

process.once("SIGTERM", () => localMcp.close());
process.once("SIGINT", () => localMcp.close());

// ---------------------------------------------------------------------------
// Helper: call a tool on the local MCP server and parse its JSON text result
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
// Tools
// ---------------------------------------------------------------------------

const readLocalFileTool = new FunctionTool({
  name: "read_local_file",
  description:
    "Read a text file from the server's local sandbox folder (local_data/).",
  parameters: z.object({
    fileName: z.string().describe("Name of the file inside local_data/, e.g. 'notes.txt'."),
  }),
  execute: async ({ fileName }) => {
    console.log(`[LocalToolsAgent] read_local_file called with fileName=${fileName}`);

    const result = await callLocalTool("read_local_file", { fileName });

    if (result.error) {
      return { message: `Error reading file: ${result.error}` };
    }

    return {
      message: `Contents of ${result.fileName}:\n${result.content}`,
    };
  },
});

const listLocalDirectoryTool = new FunctionTool({
  name: "list_local_directory",
  description:
    "List files and folders inside the server's local sandbox folder (local_data/).",
  parameters: z.object({}),
  execute: async () => {
    console.log("[LocalToolsAgent] list_local_directory called");

    const result = await callLocalTool("list_local_directory", {});

    if (result.error) {
      return { message: `Error listing directory: ${result.error}` };
    }

    if (!result.items || result.items.length === 0) {
      return { message: `No files found in ${result.folder}.` };
    }

    const lines = result.items.map(
      (item, i) => `${i + 1}. ${item.name} (${item.type})`
    );

    return {
      message: `Found ${result.items.length} item(s) in ${result.folder}:\n${lines.join("\n")}`,
    };
  },
});

const getServerTimeTool = new FunctionTool({
  name: "get_server_time",
  description: "Return the current date/time on the machine running the local MCP server.",
  parameters: z.object({}),
  execute: async () => {
    console.log("[LocalToolsAgent] get_server_time called");

    const result = await callLocalTool("get_server_time", {});

    return {
      message: `Server time is ${result.local} (ISO: ${result.iso}).`,
    };
  },
});

const queryLocalWellsTool = new FunctionTool({
  name: "query_local_wells",
  description: "Query wells from the project's local SQLite database (gis.db).",
  parameters: z.object({
    limit: z.number().optional().describe("Max number of wells to return. Defaults to 10."),
  }),
  execute: async ({ limit }) => {
    console.log(`[LocalToolsAgent] query_local_wells called with limit=${limit}`);

    const result = await callLocalTool("query_local_wells", { limit: limit ?? 10 });

    if (result.error) {
      return { message: `Error querying wells: ${result.error}`, firstLocation: null };
    }

    if (!result.wells || result.wells.length === 0) {
      return { message: "No wells found in the local database.", firstLocation: null };
    }

    const lines = result.wells.map(
      (w, i) => `${i + 1}. ${w.name} at (${w.latitude.toFixed(4)}, ${w.longitude.toFixed(4)})`
    );

    const first = result.wells[0];
    const firstLocation =
      first && first.latitude != null && first.longitude != null
        ? {
            latitude: first.latitude,
            longitude: first.longitude,
            label: first.name,
          }
        : null;

    return {
      message: `Found ${result.wells.length} well(s):\n${lines.join("\n")}`,
      firstLocation,
    };
  },
});

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

const gisAgent = new LlmAgent({
  name: "local_tools_assistant",
  model: "gemini-2.5-flash",
  instruction: `
You are a local-tools assistant running on the user's machine.

You can:
1. Read a local file (read_local_file) when the user asks about a file's contents.
2. List a local folder (list_local_directory) when the user asks what files exist.
3. Report the server's current time (get_server_time) when asked.
4. Query the local wells database (query_local_wells) when asked about wells.

After a tool returns { message, firstLocation? }:
- Return the "message" as plain text to the user.
`,
  tools: [readLocalFileTool, listLocalDirectoryTool, getServerTimeTool, queryLocalWellsTool],
});

const APP_NAME = "local-tools-app";
const sessionService = new InMemorySessionService();

const runner = new Runner({
  appName: APP_NAME,
  agent: gisAgent,
  sessionService: sessionService,
});

async function ensureSession(appName, userId, sessionId) {
  const existing = await sessionService.getSession({ appName, userId, sessionId });
  if (!existing) {
    console.log(`[LocalToolsAgent Session] Creating new session: ${sessionId} for user: ${userId}`);
    await sessionService.createSession({ appName, userId, sessionId });
  }
}

export { runner, ensureSession, APP_NAME, gisAgent, sessionService };