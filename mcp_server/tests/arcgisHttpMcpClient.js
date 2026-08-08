import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { PORT } from "../config.js";

const DEFAULT_BASE_URL = `http://localhost:${PORT}`;

export class ArcgisHttpMcpClient {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.client = new Client(
      { name: "gis-mcp-client", version: "1.0.0" },
      { capabilities: {} }
    );
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    const sseUrl = new URL("/sse", this.baseUrl);
    console.log(`[HTTP MCP Client] Connecting to SSE: ${sseUrl.href}`);

    const transport = new SSEClientTransport(sseUrl);
    await this.client.connect(transport);
    this.connected = true;
  }

  async listTools() {
    await this.connect();
    const { tools } = await this.client.listTools();
    return tools;
  }

  async callTool(name, args) {
    await this.connect();
    return await this.client.callTool({ name, arguments: args });
  }

  async close() {
    if (!this.connected) return;
    await this.client.close();
    this.connected = false;
  }
}
