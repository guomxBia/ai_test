// server/stdio_mcp/lib/validation.js
//
// Reusable input validation.
//
// Keep validation here when it is independent of MCP transport logic
// and useful to more than one layer of the application.

/**
 * Maximum number of wells a single MCP call may return.
 *
 * Exporting the value allows definitions.js and runtime validation
 * to use exactly the same limit.
 */
export const MAX_WELL_LIMIT = 100;

/**
 * Validate and normalize the optional query_local_wells limit.
 *
 * @param {unknown} limit
 * @returns {number}
 */
export function normalizeLimit(limit) {
  // If the caller omitted the limit, use the documented default.
  if (limit === undefined || limit === null) {
    return 10;
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_WELL_LIMIT
  ) {
    throw new Error(
      `limit must be an integer between 1 and ${MAX_WELL_LIMIT}.`
    );
  }

  return limit;
}