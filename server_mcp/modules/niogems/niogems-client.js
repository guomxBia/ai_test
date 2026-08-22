// server_mcp/modules/niogems/niogems-client.js
//
// Temporary simulated Niogems Wells REST API client.
//
// Responsibilities:
// - Build and print the Niogems URL that would be called.
// - Return deterministic fake well data instead of using fetch().
// - Preserve the response shape expected by the MCP tool.
//
// This module does not know anything about MCP tools.



/**
 * Query the Niogems Wells API.
 *
 * This currently simulates the response. Switch `USE_FAKE_NIOGEMS_DATA`
 * to false and restore fetch() later when the real Niogems API is available.
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

  console.log(`[niogems] Simulated request URL: ${queryUrl}`);

  const json = await fakeNiogemsResponse({
    page,
    pageSize,
    leaseName,
    operatorName,
    status,
    fieldName,
    wellNumber,
  });

  return {
    wells: Array.isArray(json.data) ? json.data : [],
    totalItems: json.totalItems ?? null,
    page,
    pageSize,
    raw: json,
  };
}


const NIOGEMS_BASE_URL = "https://localhost:9443/NiogemsServer/v1/wells";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Simulate a Niogems REST response.
 *
 * It returns data in the same approximate API envelope that the real endpoint
 * returns, allowing queryWells() to keep its normal response-normalization
 * behavior.
 */
async function fakeNiogemsResponse({
  page,
  pageSize,
  leaseName,
  operatorName,
  status,
  fieldName,
  wellNumber,
}) {
  // Optional: simulate a small network/API delay.
  await sleep(150);

  const allWells = [
    {
      id: 1001,
      apiNumber: "42-001-00001",
      wellName: "Acme Alpha 1H",
      wellNumber: "1H",
      operatorName: "Acme",
      leaseName: "Alpha Lease",
      fieldName: "North Field",
      status: "active",
      county: "Example County",
      state: "TX",
    },
    {
      id: 1002,
      apiNumber: "42-001-00002",
      wellName: "Acme Alpha 2H",
      wellNumber: "2H",
      operatorName: "Acme",
      leaseName: "Alpha Lease",
      fieldName: "North Field",
      status: "active",
      county: "Example County",
      state: "TX",
    },
    {
      id: 1003,
      apiNumber: "35-025-00003",
      wellName: "Enbridge Cedar 7",
      wellNumber: "7",
      operatorName: "Enbridge",
      leaseName: "Cedar Lease",
      fieldName: "Lake Enaton",
      status: "shut-in",
      county: "Sample County",
      state: "OK",
    },
    {
      id: 1004,
      apiNumber: "35-025-00004",
      wellName: "Northstar Delta 3",
      wellNumber: "3",
      operatorName: "Northstar Energy",
      leaseName: "Delta Lease",
      fieldName: "South Field",
      status: "inactive",
      county: "Sample County",
      state: "OK",
    },
    {
      id: 1005,
      apiNumber: "48-123-00005",
      wellName: "Acme Bravo 5H",
      wellNumber: "5H",
      operatorName: "Acme",
      leaseName: "Bravo Lease",
      fieldName: "West Field",
      status: "active",
      county: "Demo County",
      state: "TX",
    },
  ];

  const includesIgnoreCase = (value, filter) =>
    !filter || String(value).toLowerCase().includes(filter.toLowerCase());

  const filtered = allWells.filter((well) => {
    return (
      includesIgnoreCase(well.leaseName, leaseName) &&
      includesIgnoreCase(well.operatorName, operatorName) &&
      includesIgnoreCase(well.status, status) &&
      includesIgnoreCase(well.fieldName, fieldName) &&
      includesIgnoreCase(well.wellNumber, wellNumber)
    );
  });

  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    data,
    totalItems: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
    isSimulated: true,
  };
}