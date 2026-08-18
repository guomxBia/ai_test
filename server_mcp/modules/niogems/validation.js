// server_mcp/modules/niogems/validation.js
//
// Niogems tool input validation.
//
// Responsibilities:
// - Validate page / pageSize.
// - Normalize optional string filters.
//
// These functions know nothing about MCP or HTTP transports.

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Validate an optional string argument.
 *
 * Empty strings are normalized to undefined so tools can treat
 * them the same way as omitted filters.
 */
export function normalizeOptionalString(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const normalized = value.trim();

  return normalized || undefined;
}

/**
 * Normalize the page number.
 */
export function normalizePage(value) {
  if (value === undefined || value === null) {
    return DEFAULT_PAGE;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("page must be a positive integer.");
  }

  return value;
}

/**
 * Normalize the page size.
 *
 * This prevents callers from requesting an unexpectedly large
 * number of records.
 */
export function normalizePageSize(value) {
  if (value === undefined || value === null) {
    return DEFAULT_PAGE_SIZE;
  }

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_PAGE_SIZE
  ) {
    throw new Error(
      `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}.`
    );
  }

  return value;
}