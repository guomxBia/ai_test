#!/usr/bin/env node
// stdio-mcp-server.js
// C:\Users\Mingxin.Guo\Projects\test\adk\server\stdio_mcp\stdio-mcp-server.js
//
// PURPOSE (demo / learning):
// Stdio transport is meant for tools that only make sense *on the local
// machine* — reading local files, querying a local database, inspecting
// the local filesystem, etc. It talks over stdin/stdout with whatever
// process spawned it (see arcgisStdioMcpClient.js), so there's no network
// hop and no remote server involved.
//
// This file is intentionally self-contained and does NOT import anything
// from mcp_server/arcgis — that logic belongs to the HTTP/SSE server,
// which is the right transport for querying a *remote* ArcGIS service.
//
// Tools demonstrated here:
//   1. read_local_file      - read a text file from a sandboxed local folder
//   2. list_local_directory - list files/folders in a sandboxed local folder
//   3. get_server_time      - trivial no-I/O example (good first tool to study)
//   4. query_local_wells    - read from the project's local SQLite wells DB

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getWells } from "../db/dbtables.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sandbox root for file tools — never allow reading outside this folder.
// Create a "local_data" folder next to this file and drop test files in it.
const SANDBOX_ROOT = path.join(__dirname, "local_data");

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "read_local_file",
    description:
      "Read a text file from the server's local sandbox folder (local_data/). " +
      "Only relative filenames within that folder are allowed.",
    inputSchema: {
      type: "object",
      properties: {
        fileName: {
          type: "string",
          description: "Name of the file inside local_data/, e.g. 'notes.txt'.",
        },
      },
      required: ["fileName"],
    },
  },
  {
    name: "list_local_directory",
    description: "List files and folders inside the server's local sandbox folder (local_data/).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_server_time",
    description: "Return the current date/time on the machine running this MCP server.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "query_local_wells",
    description: "Query wells from the project's local SQLite database (gis.db).",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max number of wells to return. Defaults to 10.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function handleReadLocalFile({ fileName }) {
  if (!fileName || fileName.includes("..") || path.isAbsolute(fileName)) {
    throw new Error("Invalid fileName. Only simple relative filenames are allowed.");
  }

  const fullPath = path.join(SANDBOX_ROOT, fileName);
  const content = await fs.readFile(fullPath, "utf8");
  return { fileName, content };
}

async function handleListLocalDirectory() {
  await fs.mkdir(SANDBOX_ROOT, { recursive: true }); // ensure it exists for the demo
  const entries = await fs.readdir(SANDBOX_ROOT, { withFileTypes: true });
  const items = entries.map((e) => ({
    name: e.name,
    type: e.isDirectory() ? "directory" : "file",
  }));
  return { folder: SANDBOX_ROOT, items };
}

function handleGetServerTime() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    local: now.toString(),
    timezoneOffsetMinutes: now.getTimezoneOffset(),
  };
}

function handleQueryLocalWells({ limit = 10 } = {}) {
  const wells = getWells();
  return {
    count: Math.min(wells.length, limit),
    wells: wells.slice(0, limit),
  };
}

// ---------------------------------------------------------------------------
// MCP server wiring
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "local-tools-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[local-tools-server] Tool called: ${name}`, args);

  try {
    let result;
    switch (name) {
      case "read_local_file":
        result = await handleReadLocalFile(args || {});
        break;
      case "list_local_directory":
        result = await handleListLocalDirectory();
        break;
      case "get_server_time":
        result = handleGetServerTime();
        break;
      case "query_local_wells":
        result = handleQueryLocalWells(args || {});
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  } catch (err) {
    console.error(`[local-tools-server] Tool "${name}" failed:`, err);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Local-tools MCP server running (stdio)");
}

main().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});