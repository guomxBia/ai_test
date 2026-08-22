import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

import { config } from "../config.js";

let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const transport = new SSEClientTransport(new URL(config.mcp.sseUrl));

      const client = new Client(
        { name: "ai-query-server", version: "1.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      console.log(`[mcp-client] Connected to ${config.mcp.sseUrl}`);

      return client;
    })().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
}

export async function listTools() {
  const client = await getClient();
  const result = await client.listTools();
  return result.tools ?? [];
}

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

  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error(`MCP tool "${name}" returned invalid JSON text.`);
  }

  if (result.isError) {
    throw new Error(parsed?.error ?? `MCP tool "${name}" failed.`);
  }

  return parsed;
}