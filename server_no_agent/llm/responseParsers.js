// server/llm/responseParsers.js
//
// Convert Ollama's raw path/query string output into MCP tool arguments.
//
// Ollama is prompted (see systemPrompts.js) to produce a URL-shaped
// string rather than structured arguments. These parsers translate
// that string back into the argument shape the MCP tools expect.

export function parseNiogemsPath(rawPath) {
  const [pathPart, queryPart] = rawPath.split("?");
  const pathMatch = pathPart.match(/\/page\/(\d+)\/pagesize\/(\d+)/);

  if (!pathMatch) {
    throw new Error(`Unrecognized Niogems path from AI: "${rawPath}"`);
  }

  const args = {
    page: Number(pathMatch[1]),
    pageSize: Number(pathMatch[2]),
  };

  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    for (const key of ["leaseName", "operatorName", "status", "fieldName", "wellNumber"]) {
      const value = params.get(key);
      if (value) args[key] = value;
    }
  }

  return args;
}

export function parseUsgsQuery(rawQuery) {
  const queryPart = rawQuery.startsWith("?") ? rawQuery.slice(1) : rawQuery;
  const params = new URLSearchParams(queryPart);
  const args = {};

  const t_state = params.get("t_state");
  if (t_state) args.t_state = t_state.replace(/^eq\./, "");

  const t_county = params.get("t_county");
  if (t_county) args.t_county = t_county.replace(/^eq\./, "");

  const t_manu = params.get("t_manu");
  if (t_manu) args.t_manu = t_manu.replace(/^ilike\.\*?/, "").replace(/\*?$/, "");

  const t_cap = params.get("t_cap");
  if (t_cap) {
    const [op, value] = t_cap.split(".");
    args.cap_operator = op;
    args.t_cap = Number(value);
  }

  const t_hh = params.get("t_hh");
  if (t_hh) {
    const [op, value] = t_hh.split(".");
    args.hh_operator = op;
    args.t_hh = Number(value);
  }

  const p_year = params.get("p_year");
  if (p_year) args.p_year = Number(p_year.replace(/^eq\./, ""));

  const order = params.get("order");
  if (order) args.sort_order = order;

  const limit = params.get("limit");
  if (limit) args.limit = Number(limit);

  const offset = params.get("offset");
  if (offset) args.offset = Number(offset);

  return args;
}