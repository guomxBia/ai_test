// server_mcp/modules/niogems/tools.js
//
// MCP tools backed by the Niogems Wells REST API.
//
// Each tool contains its public MCP definition and private handler together.
// This prevents tool metadata and implementation from drifting apart.

import { queryWells } from "./niogems-client.js";

import {
  normalizeOptionalString,
  normalizePage,
  normalizePageSize,
} from "./validation.js";

/**
 * Shared JSON Schema for bounded, paginated query results.
 *
 * Runtime validation is still enforced by normalizePageSize().
 */
const PAGE_SIZE_SCHEMA = {
  type: "integer",
  minimum: 1,
  maximum: 100,
  default: 10,
  description: "Results per page. Default is 10; maximum is 100.",
};

/** Query oil and gas wells from the Niogems database. */
const niogemsWellsTool = {
  name: "query_niogems_wells",
  description:
    "Search oil and gas wells from the Niogems database by operator, " +
    "lease, field, well number, or status.",
  inputSchema: {
    type: "object",
    properties: {
      leaseName: {
        type: "string",
        description: "Name of the oil/gas lease.",
      },
      operatorName: {
        type: "string",
        description: "Name of the operating company (e.g. Enbridge).",
      },
      status: {
        type: "string",
        description: "Well status (e.g. active, shut-in).",
      },
      fieldName: {
        type: "string",
        description: "Field name (e.g. Lake Enaton).",
      },
      wellNumber: {
        type: "string",
        description: "Specific well identification number.",
      },
      page: {
        type: "integer",
        minimum: 1,
        default: 1,
        description: "Page number for pagination.",
      },
      pageSize: PAGE_SIZE_SCHEMA,
    },
    additionalProperties: false,
  },
  async handler(args = {}) {
    const leaseName = normalizeOptionalString(args.leaseName, "leaseName");
    const operatorName = normalizeOptionalString(
      args.operatorName,
      "operatorName"
    );
    const status = normalizeOptionalString(args.status, "status");
    const fieldName = normalizeOptionalString(args.fieldName, "fieldName");
    const wellNumber = normalizeOptionalString(
      args.wellNumber,
      "wellNumber"
    );
    const page = normalizePage(args.page);
    const pageSize = normalizePageSize(args.pageSize);

    return queryWells({
      page,
      pageSize,
      leaseName,
      operatorName,
      status,
      fieldName,
      wellNumber,
    });
  },
};

/** Tools contributed by the Niogems module to the global tool registry. */
export const niogemsTools = Object.freeze([niogemsWellsTool]);