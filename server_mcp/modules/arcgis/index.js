// server_mcp/modules/arcgis/index.js
//
// Public interface for the ArcGIS module.
//
// Code outside this directory should normally import from this file
// rather than reaching into the module's internal implementation.

/**
 * Export the MCP tools provided by this module.
 */
export {
  arcgisTools as tools,
} from "./tools.js";