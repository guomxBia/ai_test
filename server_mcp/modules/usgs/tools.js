// server_mcp/modules/usgs/tools.js
//
// MCP tools backed by the USGS U.S. Wind Turbine Database (USWTDB) API.
//
// Each tool contains its public MCP definition and private handler together.
// This prevents tool metadata and implementation from drifting apart.

import { queryTurbines } from "./usgs-client.js";

import {
  normalizeLimit,
  normalizeOffset,
  normalizeOperator,
  normalizeOptionalNumber,
  normalizeOptionalString,
  normalizeSortOrder,
  normalizeStateAbbrev,
} from "./validation.js";

/** Query U.S. wind turbines from the USWTDB feature layer. */
const usgsTurbinesTool = {
  name: "query_usgs_turbines",
  description:
    "Search U.S. Wind Turbine Database (USWTDB) records by state, " +
    "county, manufacturer, capacity, or year.",
  inputSchema: {
    type: "object",
    properties: {
      t_state: {
        type: "string",
        description: "Two-letter US state abbreviation (e.g. IA, TX).",
      },
      t_county: {
        type: "string",
        description: "County name (e.g. Story County).",
      },
      t_manu: {
        type: "string",
        description: "Turbine manufacturer (e.g. Vestas, GE Wind).",
      },
      t_cap: {
        type: "number",
        description: "Turbine rated capacity in kW.",
      },
      cap_operator: {
        type: "string",
        enum: ["gt", "lt", "eq"],
        default: "eq",
        description:
          "Comparison operator for capacity: 'gt' (greater than), " +
          "'lt' (less than), or 'eq' (equal).",
      },
      t_hh: {
        type: "number",
        description: "Turbine hub height in meters.",
      },
      hh_operator: {
        type: "string",
        enum: ["gt", "lt", "eq"],
        default: "eq",
        description:
          "Comparison operator for hub height: 'gt', 'lt', or 'eq'.",
      },
      p_year: {
        type: "integer",
        description: "Project operational year.",
      },
      sort_order: {
        type: "string",
        description: "Sort column and direction (e.g. 'p_year.desc').",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 10,
        description: "Number of records to return. Maximum is 100.",
      },
      offset: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Record offset for pagination.",
      },
    },
    additionalProperties: false,
  },
  async handler(args = {}) {
    const t_state = normalizeStateAbbrev(args.t_state);
    const t_county = normalizeOptionalString(args.t_county, "t_county");
    const t_manu = normalizeOptionalString(args.t_manu, "t_manu");
    const t_cap = normalizeOptionalNumber(args.t_cap, "t_cap");
    const cap_operator = normalizeOperator(
      args.cap_operator,
      "cap_operator"
    );
    const t_hh = normalizeOptionalNumber(args.t_hh, "t_hh");
    const hh_operator = normalizeOperator(args.hh_operator, "hh_operator");
    const p_year = normalizeOptionalNumber(args.p_year, "p_year");
    const sort_order = normalizeSortOrder(args.sort_order);
    const limit = normalizeLimit(args.limit);
    const offset = normalizeOffset(args.offset);

    return queryTurbines({
      limit,
      offset,
      t_state,
      t_county,
      t_manu,
      t_cap,
      cap_operator,
      t_hh,
      hh_operator,
      p_year,
      sort_order,
    });
  },
};

/** Tools contributed by the USGS module to the global tool registry. */
export const usgsTools = Object.freeze([usgsTurbinesTool]);