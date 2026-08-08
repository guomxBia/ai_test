// arcgisHttpMcpClient.js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { HTTP_MCP_BASE_URL } from "../config.js";

export class arcgisHttpMcpClient {
  constructor(baseUrl = HTTP_MCP_BASE_URL) {
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

  // ---- Convenience wrappers so existing agent code needs minimal changes ----

  async queryPowerPlants({ state, plantNameLike, maxFeatures }) {
    const response = await this.callTool("query_power_plants_us_eia", {
      state,
      plantNameLike,
      maxFeatures,
    });
    return this._parseToolResponse(response);
  }

  async queryNpsParks({ unitNameLike, maxFeatures }) {
    const response = await this.callTool("query_nps_parks", {
      unitNameLike,
      maxFeatures,
    });
    return this._parseToolResponse(response);
  }

  async queryBiaOffices({ agencyNameLike, regionLike, maxFeatures }) {
    const response = await this.callTool("query_bia_offices", {
      agencyNameLike,
      regionLike,
      maxFeatures,
    });
    return this._parseToolResponse(response);
  }

  _parseToolResponse(response) {
    // MCP tool results come back as { content: [{ type: "text", text: "...json..." }] }
    const content = response.content || [];
    for (const part of content) {
      if (part.type === "text" && part.text) {
        try {
          return JSON.parse(part.text);
        } catch {
          return { raw: part.text };
        }
      }
    }
    return { raw: response };
  }
}