// server/stdio_mcp/tools/wells-tools.js
//
// Database-related MCP tool implementations.
//
// Responsibilities:
// - Query project well data.
// - Apply database/tool-specific validation.
//
// Filesystem and MCP protocol logic should not live here.

import { getWells } from "../../db/dbtables.js";

import { normalizeLimit } from "../lib/validation.js";

/**
 * MCP tool: query_local_wells
 *
 * Return a bounded collection of wells from the local database.
 */
export function handleQueryLocalWells({ limit } = {}) {
  // Never use raw MCP/LLM input directly as a database or
  // array limit.
  const safeLimit = normalizeLimit(limit);

  const wells = getWells();

  // Protect this layer from unexpected changes in dbtables.js.
  if (!Array.isArray(wells)) {
    throw new Error(
      "Local wells database returned an invalid result."
    );
  }

  return {
    count: Math.min(wells.length, safeLimit),

    // The current getWells() implementation returns the complete
    // collection, so limiting happens in memory.
    wells: wells.slice(0, safeLimit),
  };
}