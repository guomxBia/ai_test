#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const server = new Server(
  {
    name: "arcgis-docs",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOL_NAME = "search_arcgis_docs";

// ✅ CORRECT: Use ListToolsRequestSchema (not string "tools/list")
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: TOOL_NAME,
        description: "Search the ArcGIS JavaScript API documentation by class.method",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Class.method format like 'geometryEngine.union'",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// ✅ CORRECT: Use CallToolRequestSchema (not string "tools/call")
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== TOOL_NAME) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { query } = request.params.arguments;

  try {
    // Validate query format
    const parts = query.split(".");
    if (parts.length !== 2) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Invalid query format. Please use 'ClassName.methodName' (e.g., 'Map.addLayer').",
          },
        ],
      };
    }

    const [cls, method] = parts;
    
    // Fix: Handle special cases and correct URL format
    let url;
    const lowerCls = cls.toLowerCase();
    
    // Special handling for common classes
    if (lowerCls === 'map') {
      url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html`;
    } else if (lowerCls === 'mapview') {
      url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html`;
    } else if (lowerCls === 'sceneview') {
      url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-views-SceneView.html`;
    } else if (lowerCls === 'geometryengine') {
      url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-geometry-geometryEngine.html`;
    } else if (lowerCls === 'featurelayer') {
      url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-FeatureLayer.html`;
    } else {
      // Default: try direct class name (works for most cases)
      url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-${cls}.html`;
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "ArcGIS-MCP-Server/1.0" },
    });

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch docs for '${cls}' (HTTP ${response.status}).\nURL: ${url}\n\n💡 Try these formats:\n- Map.addLayer\n- MapView.center\n- FeatureLayer.queryFeatures\n- geometryEngine.union`,
          },
        ],
      };
    }

    const html = await response.text();

    // Look for the method in the HTML
    const methodRegex = new RegExp(`<h3[^>]*id="[^"]*${method}[^"]*"[^>]*>.*?${method}.*?</h3>`, "i");
    const sectionRegex = new RegExp(`${method}[\\s\\S]{0,1000}`, "i");
    
    let snippet = `Method '${method}' documentation found. Visit the URL for full details.`;
    
    // Try to extract a meaningful snippet
    const methodMatch = html.match(methodRegex);
    if (methodMatch) {
      const startIndex = html.indexOf(methodMatch[0]);
      const snippet_html = html.substring(startIndex, startIndex + 800);
      snippet = snippet_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (snippet.length > 400) {
        snippet = snippet.substring(0, 400) + "...";
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `**🎯 ${query}**\n**📚 ${url}**\n\n**📖 Documentation:**\n${snippet}\n\n---\n*Visit the URL above for complete documentation, parameters, and examples.*`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `⚠️ Error: ${err.message}\nQuery: "${query}"`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ ArcGIS MCP server running");
}

main().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});