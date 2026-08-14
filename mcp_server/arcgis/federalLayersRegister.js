//mcp_server\arcgis\arcgisMcpRegister.js
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  ARCGIS_MCP_TOOLS,
  executeArcgisMcpTool,
  formatArcgisToolResult,
} from "./federalLayerTools.js";

/** Register ListTools / CallTool handlers shared by stdio and HTTP MCP servers. */
export function registerArcgisMcpHandlers(server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ARCGIS_MCP_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const { where, features } = await executeArcgisMcpTool(name, args);
      return formatArcgisToolResult(where, features);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `ArcGIS tool error (${name}): ${err.message}`,
          },
        ],
      };
    }
  });
}
