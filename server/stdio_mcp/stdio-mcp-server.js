#!/usr/bin/env node
//C:\Users\Mingxin.Guo\Projects\test\adk\server\stdio_mcp\stdio-mcp-server.js

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerArcgisMcpHandlers } from "../../mcp_server/arcgis/arcgisMcpRegister.js";

const server = new Server(
  { name: "arcgis-features-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

registerArcgisMcpHandlers(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ ArcGIS features MCP server running (stdio)");
}

main().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});
