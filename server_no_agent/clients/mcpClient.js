// server/clients/mcpClient.js
//
// MCP client wrapper.
//
// Responsibilities:
// - Maintain a single MCP client connection to the tool server.
// - Expose tools/list and tools/call as plain async functions.
//
// This module knows nothing about LLMs or HTTP routes.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

import { MCP_SERVER_SSE_URL } from "../config.js";

let clientPromise = null;

/**
 * Lazily create and connect a single shared MCP client.
 *
 * Reusing one connection avoids reconnecting on every request.
 */
function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const transport = new SSEClientTransport(new URL(MCP_SERVER_SSE_URL));

      const client = new Client(
        { name: "ai-query-server", version: "1.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);

      console.log(`[mcp-client] Connected to ${MCP_SERVER_SSE_URL}`);

      return client;
    })().catch((error) => {
      // Allow a later call to retry instead of caching a failed connection.
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
}

/**
 * List all tools currently registered on the MCP tool server.
 */
export async function listTools() {
  const client = await getClient();
  const result = await client.listTools();
  return result.tools ?? [];
}

/**
 * Call a single MCP tool by name and return its parsed result.
 *
 * MCP tools return content blocks; this unwraps the JSON text block
 * that tool-registry.js on the server side produces.
 */
export async function callTool(name, args = {}) {
  const client = await getClient();

  const result = await client.callTool({
    name,
    arguments: args,
  });

  const textBlock = result.content?.find((block) => block.type === "text");

  if (!textBlock) {
    throw new Error(`MCP tool "${name}" returned no text content.`);
  }

  const parsed = JSON.parse(textBlock.text);

  if (result.isError) {
    throw new Error(parsed.error ?? `MCP tool "${name}" failed.`);
  }

  return parsed;
}