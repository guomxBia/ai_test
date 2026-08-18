// server_mcp/modules/usgs/usgs-client.js
//
// Small USGS U.S. Wind Turbine Database (USWTDB) client.
//
// Responsibilities:
// - Build PostgREST-syntax query requests.
// - Perform HTTP requests.
// - Return normalized turbine data.
//
// This module does not know anything about MCP tools.

const USGS_BASE_URL = "https://energy.usgs.gov/api/uswtdb/v1/turbines";

/**
 * Query the USGS Wind Turbines API (PostgREST syntax).
 *
 * @param {object} options
 * @param {number} options.limit
 * @param {number} options.offset
 * @param {string} [options.t_state]
 * @param {string} [options.t_county]
 * @param {string} [options.t_manu]
 * @param {number} [options.t_cap]
 * @param {string} [options.cap_operator]
 * @param {number} [options.t_hh]
 * @param {string} [options.hh_operator]
 * @param {number} [options.p_year]
 * @param {string} [options.sort_order]
 */
export async function queryTurbines({
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
}) {
  const params = new URLSearchParams();

  if (t_state) params.append("t_state", `eq.${t_state}`);
  if (t_county) params.append("t_county", `eq.${t_county}`);
  if (t_manu) params.append("t_manu", `ilike.*${t_manu}*`);

  if (t_cap !== undefined) {
    params.append("t_cap", `${cap_operator}.${t_cap}`);
  }
  if (t_hh !== undefined) {
    params.append("t_hh", `${hh_operator}.${t_hh}`);
  }
  if (p_year !== undefined) params.append("p_year", `eq.${p_year}`);
  if (sort_order) params.append("order", sort_order);

  params.append("limit", limit);
  params.append("offset", offset);

  const queryUrl = `${USGS_BASE_URL}?${params.toString()}`;

  const response = await fetch(queryUrl);

  if (!response.ok) {
    throw new Error(
      `USGS turbines query failed: HTTP ${response.status}`
    );
  }

  const records = await response.json();

  /**
   * Return only the turbine information tools normally need.
   *
   * Keeping this normalization here means individual MCP tools
   * don't need to understand the PostgREST response shape.
   */
  return {
    turbines: Array.isArray(records) ? records : [],
    count: Array.isArray(records) ? records.length : 0,
    limit,
    offset,
  };
}