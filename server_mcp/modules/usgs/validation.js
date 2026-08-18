// server_mcp/modules/usgs/validation.js
//
// USGS turbines tool input validation.
//
// Responsibilities:
// - Validate limit / offset.
// - Validate state abbreviation.
// - Validate numeric comparison operators.
// - Validate sort order against a fixed field allowlist.
//
// These functions know nothing about MCP or HTTP transports.

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_OFFSET = 0;

const VALID_OPERATORS = ["gt", "lt", "eq"];

/**
 * Fixed allowlist of sortable fields.
 *
 * sort_order is passed almost directly into the PostgREST `order`
 * param, so it must never accept arbitrary user text.
 */
const SORTABLE_FIELDS = [
  "t_state",
  "t_county",
  "t_manu",
  "t_cap",
  "t_hh",
  "p_year",
];

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
 * Normalize a two-letter U.S. state abbreviation.
 */
export function normalizeStateAbbrev(value) {
  const state = normalizeOptionalString(value, "t_state");

  if (!state) {
    return undefined;
  }

  if (!/^[a-zA-Z]{2}$/.test(state)) {
    throw new Error(
      "t_state must be a two-letter U.S. state abbreviation."
    );
  }

  return state.toUpperCase();
}

/**
 * Normalize an optional numeric argument.
 */
export function normalizeOptionalNumber(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName} must be a number.`);
  }

  return value;
}

/**
 * Normalize a comparison operator used alongside t_cap / t_hh.
 */
export function normalizeOperator(value, fieldName) {
  if (value === undefined || value === null) {
    return "eq";
  }

  if (!VALID_OPERATORS.includes(value)) {
    throw new Error(
      `${fieldName} must be one of: ${VALID_OPERATORS.join(", ")}.`
    );
  }

  return value;
}

/**
 * Normalize the sort_order argument.
 *
 * Expected shape: "{field}.{asc|desc}", e.g. "p_year.desc".
 */
export function normalizeSortOrder(value) {
  const sortOrder = normalizeOptionalString(value, "sort_order");

  if (!sortOrder) {
    return undefined;
  }

  const [field, direction] = sortOrder.split(".");

  if (
    !SORTABLE_FIELDS.includes(field) ||
    !["asc", "desc"].includes(direction)
  ) {
    throw new Error(
      `sort_order must be one of the sortable fields (${SORTABLE_FIELDS.join(
        ", "
      )}) followed by .asc or .desc, e.g. "p_year.desc".`
    );
  }

  return sortOrder;
}

/**
 * Normalize the result limit.
 *
 * This prevents callers from requesting an unexpectedly large
 * number of records.
 */
export function normalizeLimit(value) {
  if (value === undefined || value === null) {
    return DEFAULT_LIMIT;
  }

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_LIMIT
  ) {
    throw new Error(
      `limit must be an integer between 1 and ${MAX_LIMIT}.`
    );
  }

  return value;
}

/**
 * Normalize the result offset.
 */
export function normalizeOffset(value) {
  if (value === undefined || value === null) {
    return DEFAULT_OFFSET;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error("offset must be a non-negative integer.");
  }

  return value;
}