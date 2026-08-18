// mcp_server/tool-registry.js
//
// Global MCP tool registry.
//
// Responsibilities:
// - Combine tools from independent modules.
// - Return MCP-safe public tool definitions.
// - Find and execute a tool by name.
//
// This is the only layer that needs to know which feature modules
// are currently installed.

import {
  tools as arcgisTools,
} from "./modules/arcgis/index.js";

/**
 * Register feature modules here.
 *
 * Future modules can be added without changing mcp-server.js:
 *
 * import { tools as usgsTools } from "./modules/usgs/index.js";
 * import { tools as censusTools } from "./modules/census/index.js";
 *
 * const registeredTools  = [
 *   ...arcgisTools,
 *   ...usgsTools,
 *   ...censusTools,
 * ];
 */
const registeredTools  = [
  ...arcgisTools,
];

/**
 * Build a Map once at startup for fast tool lookup.
 *
 * This also gives us a convenient place to detect duplicate names.
 */
const toolByName = new Map();

for (const tool of registeredTools ) {
  if (!tool?.name) {
    throw new Error(
      "Every MCP tool must have a name."
    );
  }

  if (typeof tool.handler !== "function") {
    throw new Error(
      `MCP tool "${tool.name}" does not have a handler.`
    );
  }

  if (toolByName.has(tool.name)) {
    throw new Error(
      `Duplicate MCP tool name: ${tool.name}`
    );
  }

  toolByName.set(tool.name, tool);
}

/**
 * Return definitions suitable for MCP tools/list.
 *
 * handler is intentionally NOT exposed to the MCP client.
 */
export function getToolDefinitions() {
  return registeredTools .map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

/**
 * Execute an MCP tool by name.
 */
export async function executeTool(
  name,
  args = {}
) {
  const tool = toolByName.get(name);

  if (!tool) {
    throw new Error(
      `Unknown MCP tool: ${name}`
    );
  }

  return await tool.handler(args);
}