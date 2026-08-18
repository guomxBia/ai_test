// server_mcp/modules/usgs/index.js
//
// Public interface for the USGS module.
//
// Code outside this directory should normally import from this file
// rather than reaching into the module's internal implementation.

/**
 * Export the MCP tools provided by this module.
 */
export {
  usgsTools as tools,
} from "./tools.js";