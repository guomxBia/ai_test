// mcp_server/modules/arcgis/arcgis-client.js
//
// Small ArcGIS REST FeatureServer client.
//
// Responsibilities:
// - Build ArcGIS /query requests.
// - Perform HTTP requests.
// - Detect ArcGIS service errors.
// - Return normalized feature data.
//
// This module does not know anything about MCP tools.

/**
 * Query an ArcGIS FeatureServer layer.
 *
 * @param {object} options
 * @param {string} options.url
 * @param {string} [options.where]
 * @param {string} [options.outFields]
 * @param {number} [options.maxFeatures]
 * @param {boolean} [options.returnGeometry]
 */
export async function queryFeatureLayer({
  url,
  where = "1=1",
  outFields = "*",
  maxFeatures = 10,
  returnGeometry = true,
}) {
  if (!url || typeof url !== "string") {
    throw new Error(
      "A valid ArcGIS FeatureServer URL is required."
    );
  }

  const params = new URLSearchParams({
    f: "json",
    where,
    outFields,
    resultRecordCount: String(maxFeatures),
    returnGeometry: String(returnGeometry),
  });

  const queryUrl =
    `${url}/query?${params.toString()}`;

  const response = await fetch(queryUrl);

  if (!response.ok) {
    throw new Error(
      `ArcGIS query failed: HTTP ${response.status}`
    );
  }

  const json = await response.json();

  /**
   * ArcGIS may return HTTP 200 while placing the actual error
   * inside the JSON response.
   *
   * Handle that separately from HTTP-level errors.
   */
  if (json.error) {
    const message =
      json.error.message ??
      "Unknown ArcGIS service error.";

    throw new Error(
      `ArcGIS service error: ${message}`
    );
  }

  if (!Array.isArray(json.features)) {
    return {
      features: [],
      raw: json,
    };
  }

  /**
   * Return only the feature information tools normally need.
   *
   * Keeping this normalization here means individual MCP tools
   * don't need to understand the ArcGIS response envelope.
   */
  const features = json.features.map((feature) => ({
    attributes: feature.attributes ?? {},
    geometry: feature.geometry ?? null,
  }));

  return {
    features,
    raw: json,
  };
}