// server/stdio_mcp/tools/tool-registry.js
//
// Single source of truth for the local MCP tools.
//
// Each entry contains both:
// - The public MCP metadata returned by tools/list.
// - The handler invoked by tools/call.
//
// To add a tool, import its handler and add one object to TOOL_REGISTRY.
// server.js derives both the advertised tool list and the handler lookup
// from this module, so their names cannot drift apart.

import {
  handleReadLocalFile,
  handleListLocalDirectory,
} from "./file-tools.js";

import { handleQueryLocalWells } from "./wells-tools.js";

import { handleGetServerTime } from "./system-tools.js";

import { MAX_WELL_LIMIT } from "../lib/validation.js";

/**
 * Tool definitions plus their implementations.
 *
 * Keep handler out of the object returned to MCP clients; only name,
 * description, and inputSchema are public MCP tool-definition fields.
 */
const TOOL_REGISTRY = [
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

    // Implementation for this public MCP tool.
    handler: handleReadLocalFile,
  },

  {
    name: "list_local_directory",

    description:
      "List the direct contents of the server local_data sandbox.",

    inputSchema: {
      type: "object",

      properties: {},

      additionalProperties: false,
    },

    handler: handleListLocalDirectory,
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

    handler: handleGetServerTime,
  },

  {
    name: "query_local_wells",

    description:
      "Read wells from the project local SQLite database.",

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

    handler: handleQueryLocalWells,
  },
];

/**
 * Public definitions used as the result of MCP tools/list.
 *
 * This deliberately excludes each handler function. MCP clients receive
 * only serializable tool metadata and the JSON input schema.
 */
export const TOOLS = Object.freeze(
  TOOL_REGISTRY.map(({ name, description, inputSchema }) =>
    Object.freeze({
      name,
      description,
      inputSchema,
    })
  )
);

/**
 * Map public MCP tool names to their implementations.
 *
 * This map is derived from the same TOOL_REGISTRY array as TOOLS, so a
 * public definition cannot accidentally be added without its handler.
 */
export const TOOL_HANDLERS = new Map(
  TOOL_REGISTRY.map(({ name, handler }) => [name, handler])
);

/**
 * Execute an MCP tool by its public name.
 *
 * @param {string} name Tool name received from the MCP client.
 * @param {object} args Arguments received from the MCP client.
 * @returns {Promise<unknown>} The result from the tool handler.
 */
export async function dispatchTool(name, args = {}) {
  const handler = TOOL_HANDLERS.get(name);

  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  // await supports both synchronous and asynchronous handlers.
  return await handler(args);
}