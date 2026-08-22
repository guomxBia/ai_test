import { config } from "../config.js";

const ALLOWED_TOOL_NAMES = new Set([
  "query_niogems_wells",
  "query_usgs_turbines",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`);
  }
}

function requireFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertOnlyKnownKeys(args, allowedKeys, toolName) {
  for (const key of Object.keys(args)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Argument "${key}" is not allowed for MCP tool "${toolName}".`);
    }
  }
}

function validateNiogemsArgs(args) {
  const allowed = new Set([
    "page",
    "pageSize",
    "leaseName",
    "operatorName",
    "status",
    "fieldName",
    "wellNumber",
  ]);
  assertOnlyKnownKeys(args, allowed, "query_niogems_wells");

  if (args.page !== undefined) {
    requireInteger(args.page, "page", { min: 1, max: 100000 });
  }

  if (args.pageSize !== undefined) {
    requireInteger(args.pageSize, "pageSize", {
      min: 1,
      max: config.limits.niogemsPageSize,
    });
  }

  for (const field of [
    "leaseName",
    "operatorName",
    "status",
    "fieldName",
    "wellNumber",
  ]) {
    if (args[field] !== undefined) requireString(args[field], field);
  }
}

function validateUsgsArgs(args) {
  const allowed = new Set([
    "t_state",
    "t_county",
    "t_manu",
    "cap_operator",
    "t_cap",
    "hh_operator",
    "t_hh",
    "p_year",
    "sort_order",
    "limit",
    "offset",
  ]);
  assertOnlyKnownKeys(args, allowed, "query_usgs_turbines");

  for (const field of ["t_state", "t_county", "t_manu", "sort_order"]) {
    if (args[field] !== undefined) requireString(args[field], field);
  }

  for (const field of ["cap_operator", "hh_operator"]) {
    if (args[field] !== undefined && !["eq", "gt", "gte", "lt", "lte"].includes(args[field])) {
      throw new Error(`${field} must be one of: eq, gt, gte, lt, lte.`);
    }
  }

  if (args.t_cap !== undefined) requireFiniteNumber(args.t_cap, "t_cap");
  if (args.t_hh !== undefined) requireFiniteNumber(args.t_hh, "t_hh");

  if (args.p_year !== undefined) {
    requireInteger(args.p_year, "p_year", { min: 1900, max: 2100 });
  }

  if (args.limit !== undefined) {
    requireInteger(args.limit, "limit", { min: 1, max: config.limits.usgsLimit });
  }

  if (args.offset !== undefined) {
    requireInteger(args.offset, "offset", { min: 0, max: 1000000 });
  }
}

export function validateToolCall({ name, args, tools }) {
  if (typeof name !== "string" || !name) {
    throw new Error("A tool call must include a tool name.");
  }

  if (!ALLOWED_TOOL_NAMES.has(name)) {
    throw new Error(`Tool "${name}" is not allowed by this server.`);
  }

  const registeredTool = tools.find((tool) => tool.name === name);
  if (!registeredTool) {
    throw new Error(`Tool "${name}" is not registered by the MCP server.`);
  }

  if (!isPlainObject(args)) {
    throw new Error("Tool arguments must be an object.");
  }

  if (name === "query_niogems_wells") validateNiogemsArgs(args);
  if (name === "query_usgs_turbines") validateUsgsArgs(args);

  return { name, args, tool: registeredTool };
}