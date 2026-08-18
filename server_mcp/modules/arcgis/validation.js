// server_mcp/modules/arcgis/validation.js
//
// ArcGIS tool input validation and query helpers.
//
// Responsibilities:
// - Validate maxFeatures.
// - Safely escape string values used in ArcGIS WHERE expressions.
// - Normalize U.S. state names.
//
// These functions know nothing about MCP or HTTP transports.

const DEFAULT_MAX_FEATURES = 10;
const MAX_FEATURES = 100;

/**
 * Mapping used by the EIA power plant layer.
 *
 * The EIA layer stores full state names rather than postal
 * abbreviations.
 */
const US_STATE_BY_ABBREV = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

/**
 * Escape a string value before inserting it into an ArcGIS
 * SQL-style WHERE expression.
 *
 * ArcGIS represents an apostrophe inside a string literal by
 * doubling it:
 *
 *   O'Brien -> O''Brien
 *
 * NOTE:
 * This helper should only be used for values. Field names and
 * arbitrary SQL fragments should never come directly from users.
 */
export function escapeArcgisString(value) {
  return String(value).replace(/'/g, "''");
}

/**
 * Normalize the optional maximum feature count.
 *
 * This prevents callers from requesting an unexpectedly large
 * number of records.
 */
export function normalizeMaxFeatures(value) {
  if (value === undefined || value === null) {
    return DEFAULT_MAX_FEATURES;
  }

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_FEATURES
  ) {
    throw new Error(
      `maxFeatures must be an integer between 1 and ${MAX_FEATURES}.`
    );
  }

  return value;
}

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
 * Convert an EIA state filter into the form expected by the layer.
 *
 * Examples:
 *
 *   MI       -> Michigan
 *   michigan -> Michigan
 *   New York -> New York
 */
export function resolvePowerPlantState(value) {
  const state = normalizeOptionalString(value, "state");

  if (!state) {
    return undefined;
  }

  if (state.length === 2) {
    const abbreviation = state.toUpperCase();

    const fullName = US_STATE_BY_ABBREV[abbreviation];

    if (!fullName) {
      throw new Error(
        `Unknown U.S. state abbreviation: ${state}`
      );
    }

    return fullName;
  }

  // Normalize ordinary full state names to title case.
  return state.replace(
    /\w\S*/g,
    (word) =>
      word.charAt(0).toUpperCase() +
      word.slice(1).toLowerCase()
  );
}