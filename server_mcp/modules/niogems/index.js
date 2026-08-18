// server_mcp/modules/niogems/index.js
//
// Public interface for the Niogems module.
//
// Code outside this directory should normally import from this file
// rather than reaching into the module's internal implementation.

/**
 * Export the MCP tools provided by this module.
 */
export {
  niogemsTools as tools,
} from "./tools.js";