import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerArcgisMcpHandlers } from "./arcgis/arcgisMcpRegister.js";
import { PORT } from "./config.js";

const app = express();
app.use(express.json());

const mcpServer = new Server(
  { name: "arcgis-http-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

registerArcgisMcpHandlers(mcpServer);

const activeTransports = new Map();

app.get("/sse", async (req, res) => {
  console.log("🔌 New MCP SSE Client Connection initiated");

  const transport = new SSEServerTransport("/messages", res);
  activeTransports.set(transport.sessionId, transport);

  transport.onclose = () => {
    console.log(`❌ MCP SSE Connection closed: ${transport.sessionId}`);
    activeTransports.delete(transport.sessionId);
  };

  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = activeTransports.get(sessionId);

  if (!transport) {
    return res.status(400).json({ error: "Session not found or expired" });
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ArcGIS Feature HTTP/SSE MCP Server running on port ${PORT}`);
  console.log(`   SSE Endpoint:      http://localhost:${PORT}/sse`);
  console.log(`   Message Endpoint:  http://localhost:${PORT}/messages`);
  console.log(`=======================================================`);
});
