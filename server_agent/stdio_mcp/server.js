#!/usr/bin/env node
// server/stdio_mcp/server.js
//
// Entry point for the local MCP server.
//
// Responsibilities:
// - Create the MCP server.
// - Create the stdio transport.
// - Connect the server to the transport.
// - Handle fatal startup errors.
//
// Important:
// stdin/stdout are reserved for MCP JSON-RPC traffic.
// Always use console.error() for logs so stdout is not corrupted.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { create_stdio_mcp_server } from "./stdio_mcp_server.js";

/**
 * Start the MCP server.
 */
async function main() {
  // create_stdio_mcp_server() configures all MCP request handlers.
  const server = create_stdio_mcp_server();

  // StdioServerTransport communicates with the parent process
  // using stdin/stdout.
  const transport = new StdioServerTransport();

  // Start listening for MCP protocol messages.
  await server.connect(transport);

  // stderr is safe for diagnostic messages.
  console.error("Local-tools MCP server running over stdio.");
}

// A startup failure is fatal because the parent process will not
// be able to communicate with the MCP server.
main().catch((error) => {
  console.error("Local MCP server failed to start:", error);
  process.exit(1);
});