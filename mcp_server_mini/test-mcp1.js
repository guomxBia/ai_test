#!/usr/bin/env node
/**
 * arcgis-docs-mcp-server.js
 * Implements the MCP protocol to expose an ArcGIS JS API documentation search tool.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// --- 1. Define Server Metadata ---
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

// --- 2. Define the Tool Schema (for tools/list) ---
const TOOL_NAME = "search_arcgis_docs";

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Search the ArcGIS JavaScript API documentation by class.method (e.g., geometryEngine.union) to get a code snippet and link.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The class.method string to search for, like 'geometryEngine.union' or 'Map.addLayer'.",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// --- 3. Implement the Tool Logic (for tools/call) ---
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
            text: "❌ Invalid query format. Please use 'ClassName.methodName' (e.g., 'geometryEngine.union').",
          },
        ],
      };
    }

    const [cls, method] = parts;
    // Handle both formats: "geometryEngine" and "geometry-engine"
    const classSlug = cls
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "");
    const url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-${classSlug}.html`;

    const response = await fetch(url, {
      headers: { "User-Agent": "ArcGIS-MCP-Server/1.0" },
    });

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch documentation for class '${cls}' (HTTP ${response.status}).\nURL: ${url}\n\nTip: Check if the class name is correct.`,
          },
        ],
      };
    }

    const html = await response.text();

    // Basic extraction: find relevant method section
    const regex = new RegExp(
      `<h3[^>]*>${method}</h3>[\\s\\S]*?(?=<h3|$)`,
      "i"
    );
    const match = html.match(regex);

    let snippet =
      "Method not found in documentation. The class page was retrieved, but the method definition was missing.";
    if (match) {
      // Simple clean-up to remove HTML tags from the snippet
      snippet = match[0].replace(/<[^>]+>/g, "").trim();
      // Limit snippet length
      if (snippet.length > 500) {
        snippet = snippet.substring(0, 500) + "...";
      }
    }

    const resultText = `**🎯 Result for: ${query}**
**📚 Source:** ${url}

**📖 Documentation:**
${snippet}

---
*Tip: Visit the URL above for complete documentation, parameters, and examples.*`;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `⚠️ Error searching ArcGIS Docs: ${err.message}\n\nQuery: "${query}"`,
        },
      ],
      isError: true,
    };
  }
});

// --- 4. Start the Server using Stdio Transport ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ ArcGIS MCP server successfully connected via stdio.");
}

main().catch((err) => {
  console.error("❌ Failed to start ArcGIS MCP server:", err);
  process.exit(1);
});