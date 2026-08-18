// server_mcp/modules/arcgis/tools.js
//
// MCP tools backed by ArcGIS FeatureServer and MapServer layers.
//
// Each tool contains its public MCP definition and private handler together.
// This prevents tool metadata and implementation from drifting apart.
//
// Search inputs are literal substrings, not wildcard expressions. The helper
// below escapes ArcGIS SQL string-literal characters and LIKE wildcard
// characters so callers can safely search for names containing %, _, or \\.

import {
  BIA_OFFICES_URL,
  NPS_PARKS_URL,
  POWER_PLANTS_URL,
} from "../../config.js";

import { queryFeatureLayer } from "./arcgis-client.js";

import {
  escapeArcgisString,
  normalizeMaxFeatures,
  normalizeOptionalString,
  resolvePowerPlantState,
} from "./validation.js";

/**
 * Escape a user value for use within an ArcGIS SQL LIKE pattern.
 *
 * The SQL string literal uses doubled apostrophes. Backslash is the LIKE
 * escape character; percent and underscore are escaped so they remain
 * literal search characters rather than broad wildcards.
 */
function escapeArcgisLikeString(value) {
  return escapeArcgisString(value)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * Build a literal substring predicate for a fixed, server-controlled field.
 *
 * Field names must never come from MCP arguments. The returned ESCAPE clause
 * tells ArcGIS that a backslash escapes %, _, and backslash in the pattern.
 */
function literalContains(fieldName, value) {
  return `${fieldName} LIKE '%${escapeArcgisLikeString(value)}%' ESCAPE '\\'`;
}

/**
 * Run an ArcGIS layer query and keep the tool response shape uniform.
 */
async function runLayerQuery({ url, where, maxFeatures }) {
  const { features } = await queryFeatureLayer({
    url,
    where,
    outFields: "*",
    maxFeatures,
  });

  return {
    where,
    count: features.length,
    features,
  };
}

/**
 * Shared JSON Schema for bounded ArcGIS query results.
 *
 * Runtime validation is still enforced by normalizeMaxFeatures().
 */
const MAX_FEATURES_SCHEMA = {
  type: "integer",
  minimum: 1,
  maximum: 100,
  default: 10,
  description: "Maximum number of features to return. Default is 10; maximum is 100.",
};

/** Query U.S. power plants from the EIA ArcGIS layer. */
const powerPlantsTool = {
  name: "query_power_plants_us_eia",
  description:
    "Query U.S. power plants from the EIA feature layer. " +
    "Filter by state or a literal partial plant name.",
  inputSchema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        description:
          "Optional two-letter U.S. state abbreviation (for example MI) " +
          "or full state name (for example Michigan).",
      },
      plantNameLike: {
        type: "string",
        description: "Optional literal partial plant-name filter.",
      },
      maxFeatures: MAX_FEATURES_SCHEMA,
    },
    additionalProperties: false,
  },
  async handler(args = {}) {
    const state = resolvePowerPlantState(args.state);
    const plantNameLike = normalizeOptionalString(
      args.plantNameLike,
      "plantNameLike"
    );
    const maxFeatures = normalizeMaxFeatures(args.maxFeatures);
    const whereParts = [];

    if (state) {
      whereParts.push(`State = '${escapeArcgisString(state)}'`);
    }

    if (plantNameLike) {
      whereParts.push(literalContains("Plant_Name", plantNameLike));
    }

    const where = whereParts.length > 0 ? whereParts.join(" AND ") : "1=1";

    return runLayerQuery({
      url: POWER_PLANTS_URL,
      where,
      maxFeatures,
    });
  },
};

/** Query National Park Service units from the BLM map service. */
const npsParksTool = {
  name: "query_nps_parks",
  description:
    "Query National Park Service units from the BLM map service layer. " +
    "Filter by a literal partial unit name.",
  inputSchema: {
    type: "object",
    properties: {
      unitNameLike: {
        type: "string",
        description: "Optional literal partial National Park Service unit-name filter.",
      },
      maxFeatures: MAX_FEATURES_SCHEMA,
    },
    additionalProperties: false,
  },
  async handler(args = {}) {
    const unitNameLike = normalizeOptionalString(
      args.unitNameLike,
      "unitNameLike"
    );
    const maxFeatures = normalizeMaxFeatures(args.maxFeatures);
    const where = unitNameLike
      ? literalContains("UNIT_NAME", unitNameLike)
      : "1=1";

    return runLayerQuery({
      url: NPS_PARKS_URL,
      where,
      maxFeatures,
    });
  },
};

/** Query BIA Agency and Regional Offices. */
const biaOfficesTool = {
  name: "query_bia_agency_offices",
  description:
    "Query BIA Agency and Regional Offices. Filter by a literal partial " +
    "agency or office name and/or a literal partial region name.",
  inputSchema: {
    type: "object",
    properties: {
      agencyNameLike: {
        type: "string",
        description: "Optional literal partial agency or office-name filter.",
      },
      regionLike: {
        type: "string",
        description: "Optional literal partial region-name filter.",
      },
      maxFeatures: MAX_FEATURES_SCHEMA,
    },
    additionalProperties: false,
  },
  async handler(args = {}) {
    const agencyNameLike = normalizeOptionalString(
      args.agencyNameLike,
      "agencyNameLike"
    );
    const regionLike = normalizeOptionalString(args.regionLike, "regionLike");
    const maxFeatures = normalizeMaxFeatures(args.maxFeatures);
    const whereParts = [];

    if (agencyNameLike) {
      whereParts.push(literalContains("AGENCY_NAME", agencyNameLike));
    }

    if (regionLike) {
      whereParts.push(literalContains("REGION", regionLike));
    }

    const where = whereParts.length > 0 ? whereParts.join(" AND ") : "1=1";

    return runLayerQuery({
      url: BIA_OFFICES_URL,
      where,
      maxFeatures,
    });
  },
};

/** Tools contributed by the ArcGIS module to the global tool registry. */
export const arcgisTools = Object.freeze([
  powerPlantsTool,
  npsParksTool,
  biaOfficesTool,
]);