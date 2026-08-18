// server/stdio_mcp/server.js
//
// MCP protocol configuration.
//
// Responsibilities:
// - Create the MCP Server instance.
// - Respond to tools/list.
// - Respond to tools/call.
// - Convert tool results into MCP-compatible responses.
//
// Tool metadata and implementations are registered together in
// ./tools/tool-registry.js.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOLS, dispatchTool } from "./tools/tool-registry.js";

/**
 * Create and configure the MCP server.
 *
 * Keeping construction in a function makes the server easier to create
 * independently during tests.
 */
export function create_stdio_mcp_server() {
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
   * MCP request: tools/list
   *
   * Return the public tool definitions from the single tool registry.
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  /**
   * MCP request: tools/call
   *
   * This layer owns MCP response formatting. tool-registry.js resolves the
   * public tool name and runs its corresponding implementation.
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    // stdout belongs exclusively to MCP JSON-RPC messages.
    // Do not log args because tool arguments may contain sensitive data.
    console.error(`[local-tools-server] Tool called: ${name}`);

    try {
      const result = await dispatchTool(name, args);

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

      // Retain detailed diagnostics only in stderr server logs.
      console.error(`[local-tools-server] Tool "${name}" failed:`, error);

      // Return a controlled, MCP-compatible tool error.
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: message }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}