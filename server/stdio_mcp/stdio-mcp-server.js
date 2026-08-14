#!/usr/bin/env node
// server/stdio_mcp/stdio-mcp-server.js
//
// Local MCP server that communicates with its parent process over stdio.
//
// Important:
// - stdin/stdout are reserved for MCP JSON-RPC traffic.
// - Use console.error() for logs so logs do not corrupt MCP messages.
// - This server is local-only: the Node application spawns it as a child
//   process through StdioClientTransport.
// - File tools are restricted to ./local_data next to this file.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getWells } from "../db/dbtables.js";

// ES modules do not provide __filename and __dirname automatically.
// Recreate them so paths are always relative to this server file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is the only folder the file tools may access.
// path.resolve() makes this an absolute, normalized path.
const SANDBOX_ROOT = path.resolve(__dirname, "local_data");

// Prevent a tool call from returning an unbounded amount of database data.
const MAX_WELL_LIMIT = 100;

// -----------------------------------------------------------------------------
// MCP tool definitions
// -----------------------------------------------------------------------------
//
// This array is returned when the MCP client calls "tools/list".
// The inputSchema tells the MCP client/LLM which tool parameters are allowed.
//
// `additionalProperties: false` rejects unexpected parameters. This makes the
// interface predictable and avoids silently accepting unused user input.

const TOOLS = [
  {
    name: "read_local_file",
    description:
      "Read a UTF-8 text file from the server local_data sandbox. " +
      "Only files inside that sandbox are accessible.",
    inputSchema: {
      type: "object",
      properties: {
        fileName: {
          type: "string",
          description:
            "Relative file path inside local_data, such as 'notes.txt'.",
        },
      },
      required: ["fileName"],
      additionalProperties: false,
    },
  },
  {
    name: "list_local_directory",
    description: "List the direct contents of the server local_data sandbox.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_server_time",
    description:
      "Return the current date/time of the machine running this MCP server.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "query_local_wells",
    description: "Read wells from the project local SQLite database.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_WELL_LIMIT,
          description:
            `Maximum wells to return. Default is 10; ` +
            `maximum is ${MAX_WELL_LIMIT}.`,
        },
      },
      additionalProperties: false,
    },
  },
];

// -----------------------------------------------------------------------------
// Input validation and filesystem sandbox helpers
// -----------------------------------------------------------------------------

/**
 * Convert a user-supplied relative filename into a safe absolute path.
 *
 * This prevents directory traversal attempts such as:
 * - ../.env
 * - ../../Windows/System32/...
 * - /etc/passwd
 *
 * The first boundary check prevents normal "../" traversal. Later,
 * handleReadLocalFile() performs a second realpath() check to prevent a
 * symbolic link inside local_data from pointing outside the sandbox.
 */
function resolveSandboxPath(fileName) {
  if (typeof fileName !== "string" || !fileName.trim()) {
    throw new Error("fileName must be a non-empty string.");
  }

  // Null bytes can cause confusing behavior in path/file APIs.
  if (fileName.includes("\0")) {
    throw new Error("Invalid fileName.");
  }

  const normalizedInput = fileName.trim();

  // The API permits only paths relative to local_data.
  if (path.isAbsolute(normalizedInput)) {
    throw new Error("Absolute paths are not allowed.");
  }

  // Example:
  // SANDBOX_ROOT = C:\project\stdio_mcp\local_data
  // normalizedInput = notes.txt
  // resolvedPath = C:\project\stdio_mcp\local_data\notes.txt
  const resolvedPath = path.resolve(SANDBOX_ROOT, normalizedInput);

  // path.relative() describes where resolvedPath is relative to SANDBOX_ROOT.
  // A path starting with ".." would mean it escaped the allowed folder.
  const relativePath = path.relative(SANDBOX_ROOT, resolvedPath);

  const escapesSandbox =
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);

  if (escapesSandbox) {
    throw new Error("Requested file is outside the allowed sandbox.");
  }

  return resolvedPath;
}

/**
 * Validate and normalize the optional query_local_wells limit.
 *
 * Never pass raw browser/LLM input directly to Array.slice() or a database
 * query. This function ensures a small, predictable integer range.
 */
function normalizeLimit(limit) {
  // If the caller omitted limit, use the documented default.
  if (limit === undefined || limit === null) {
    return 10;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_WELL_LIMIT) {
    throw new Error(
      `limit must be an integer between 1 and ${MAX_WELL_LIMIT}.`
    );
  }

  return limit;
}

// -----------------------------------------------------------------------------
// Tool implementations
// -----------------------------------------------------------------------------

/**
 * Read a UTF-8 text file from local_data only.
 *
 * Security has two layers:
 * 1. resolveSandboxPath() blocks ordinary directory traversal.
 * 2. realpath() resolves symbolic links and verifies the final target is
 *    still inside local_data.
 */
async function handleReadLocalFile({ fileName } = {}) {
  // Create local_data if it does not yet exist.
  // recursive: true is safe even when the directory already exists.
  await fs.mkdir(SANDBOX_ROOT, { recursive: true });

  // Validate input and get the intended absolute path.
  const requestedPath = resolveSandboxPath(fileName);

  let canonicalSandboxRoot;
  let canonicalRequestedPath;

  try {
    // realpath() resolves symbolic links to the actual final filesystem path.
    //
    // Example attack being prevented:
    // local_data/secret-link -> C:\somewhere\secret.txt
    canonicalSandboxRoot = await fs.realpath(SANDBOX_ROOT);
    canonicalRequestedPath = await fs.realpath(requestedPath);
  } catch (error) {
    // Do not expose an internal filesystem error for a missing file.
    if (error?.code === "ENOENT") {
      throw new Error("File not found.");
    }

    throw error;
  }

  // Validate again after resolving symbolic links.
  const relativePath = path.relative(
    canonicalSandboxRoot,
    canonicalRequestedPath
  );

  const escapesSandboxThroughSymlink =
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);

  if (escapesSandboxThroughSymlink) {
    throw new Error("Requested file is outside the allowed sandbox.");
  }

  // Avoid attempting to read a directory, device, pipe, or other non-file.
  const stats = await fs.stat(canonicalRequestedPath);

  if (!stats.isFile()) {
    throw new Error("Requested path is not a regular file.");
  }

  // Read text using UTF-8 encoding.
  const content = await fs.readFile(canonicalRequestedPath, "utf8");

  return {
    // Return a relative filename, never an internal absolute filesystem path.
    fileName: path.relative(canonicalSandboxRoot, canonicalRequestedPath),
    content,
  };
}

/**
 * List the direct contents of local_data.
 *
 * This intentionally lists only one level. It does not recursively enumerate
 * the entire folder tree, which helps keep returned data bounded.
 */
async function handleListLocalDirectory() {
  await fs.mkdir(SANDBOX_ROOT, { recursive: true });

  // withFileTypes avoids a separate stat() call for every directory entry.
  const entries = await fs.readdir(SANDBOX_ROOT, {
    withFileTypes: true,
  });

  const items = entries
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory()
        ? "directory"
        : entry.isFile()
          ? "file"
          : "other",
    }))
    // Stable output makes testing and UI display easier.
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    // Do not reveal the full server path to API callers.
    folder: "local_data",
    items,
  };
}

/**
 * Return server time. This is a simple no-I/O tool useful for testing
 * MCP connection, tool discovery, and tool calls.
 */
function handleGetServerTime() {
  const now = new Date();

  return {
    iso: now.toISOString(),
    local: now.toString(),
    timezoneOffsetMinutes: now.getTimezoneOffset(),
  };
}

/**
 * Return a bounded set of local well records.
 *
 * getWells() should use parameterized database access internally if it ever
 * accepts input. In this current form, the limit is used only after data is
 * returned, and wells are sliced in memory.
 */
function handleQueryLocalWells({ limit } = {}) {
  const safeLimit = normalizeLimit(limit);
  const wells = getWells();

  // Fail early if dbtables.js unexpectedly changes its return shape.
  if (!Array.isArray(wells)) {
    throw new Error("Local wells database returned an invalid result.");
  }

  return {
    count: Math.min(wells.length, safeLimit),
    wells: wells.slice(0, safeLimit),
  };
}

// -----------------------------------------------------------------------------
// MCP server configuration
// -----------------------------------------------------------------------------

// Create the MCP server metadata and advertise that this server provides tools.
const server = new Server(
  {
    name: "local-tools-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * MCP client request: "tools/list"
 *
 * The client calls this to discover the tool names, descriptions, and JSON
 * input schemas exposed by this server.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

/**
 * MCP client request: "tools/call"
 *
 * This is the central dispatcher:
 * 1. Read the requested tool name and input arguments.
 * 2. Call the corresponding local handler.
 * 3. Return an MCP-compatible content response.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  // Use stderr only. stdout belongs exclusively to MCP protocol messages.
  // Do not log sensitive argument values here in production.
  console.error(`[local-tools-server] Tool called: ${name}`);

  try {
    let result;

    switch (name) {
      case "read_local_file":
        result = await handleReadLocalFile(args);
        break;

      case "list_local_directory":
        result = await handleListLocalDirectory();
        break;

      case "get_server_time":
        result = handleGetServerTime();
        break;

      case "query_local_wells":
        result = handleQueryLocalWells(args);
        break;

      default:
        // The MCP client requested a tool that this server does not expose.
        throw new Error(`Unknown tool: ${name}`);
    }

    // MCP tool content is an array because responses can include multiple
    // content blocks. This server returns a single JSON text block.
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected tool failure.";

    // Keep detailed diagnostic output in server logs.
    console.error(`[local-tools-server] Tool "${name}" failed:`, error);

    // isError tells the MCP client that this tool invocation failed.
    // In production, avoid returning stacks or raw system/database errors.
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: message,
          }),
        },
      ],
      isError: true,
    };
  }
});

// -----------------------------------------------------------------------------
// Server startup
// -----------------------------------------------------------------------------

async function main() {
  // Create the sandbox folder at startup so file tools are ready immediately.
  await fs.mkdir(SANDBOX_ROOT, { recursive: true });

  // StdioServerTransport reads MCP requests from stdin and writes MCP
  // responses to stdout. The parent LocalToolsStdioMcpClient owns the process.
  const transport = new StdioServerTransport();

  // Start listening for MCP protocol messages.
  await server.connect(transport);

  // stderr is safe for diagnostic messages with stdio MCP.
  console.error("Local-tools MCP server running over stdio.");
}

// If startup fails, write the error to stderr and exit with a failure code.
main().catch((error) => {
  console.error("Local MCP server failed to start:", error);
  process.exit(1);
});