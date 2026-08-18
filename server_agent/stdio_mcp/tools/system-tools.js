// server/stdio_mcp/tools/system-tools.js
//
// General system/server MCP tools.
//
// These tools do not belong to a specific application domain such
// as filesystem access or wells/database access.

/**
 * MCP tool: get_server_time
 *
 * Useful as a lightweight test tool because it requires no
 * filesystem or database access.
 */
export function handleGetServerTime() {
  const now = new Date();

  return {
    // UTC ISO-8601 representation.
    iso: now.toISOString(),

    // Human-readable representation in the server's local timezone.
    local: now.toString(),

    // Difference between local time and UTC, in minutes.
    timezoneOffsetMinutes: now.getTimezoneOffset(),
  };
}