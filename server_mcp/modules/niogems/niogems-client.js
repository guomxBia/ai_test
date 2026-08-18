// server_mcp/modules/niogems/niogems-client.js
//
// Small Niogems Wells REST API client.
//
// Responsibilities:
// - Build Niogems /page/{page}/pagesize/{pageSize} requests.
// - Perform HTTP requests.
// - Return normalized well data.
//
// This module does not know anything about MCP tools.

const NIOGEMS_BASE_URL = "https://localhost:9443/NiogemsServer/v1/wells";

/**
 * Query the Niogems Wells API.
 *
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.pageSize
 * @param {string} [options.leaseName]
 * @param {string} [options.operatorName]
 * @param {string} [options.status]
 * @param {string} [options.fieldName]
 * @param {string} [options.wellNumber]
 */
export async function queryWells({
  page,
  pageSize,
  leaseName,
  operatorName,
  status,
  fieldName,
  wellNumber,
}) {
  const params = new URLSearchParams();

  if (leaseName) params.append("leaseName", leaseName);
  if (operatorName) params.append("operatorName", operatorName);
  if (status) params.append("status", status);
  if (fieldName) params.append("fieldName", fieldName);
  if (wellNumber) params.append("wellNumber", wellNumber);

  const queryString = params.toString();

  const queryUrl =
    `${NIOGEMS_BASE_URL}/page/${page}/pagesize/${pageSize}` +
    (queryString ? `?${queryString}` : "");

  const response = await fetch(queryUrl);

  if (!response.ok) {
    throw new Error(
      `Niogems query failed: HTTP ${response.status}`
    );
  }

  const json = await response.json();

  /**
   * Return only the well information tools normally need.
   *
   * Keeping this normalization here means individual MCP tools
   * don't need to understand the Niogems response envelope.
   */
  return {
    wells: Array.isArray(json.data) ? json.data : [],
    totalItems: json.totalItems ?? null,
    page,
    pageSize,
    raw: json,
  };
}