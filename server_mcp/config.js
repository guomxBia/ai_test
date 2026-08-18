// server_mcp/config.js
//
// Central configuration for the HTTP server and external GIS services.

// -----------------------------------------------------------------------------
// HTTP server
// -----------------------------------------------------------------------------

export const PORT = Number(process.env.PORT ?? 6060);

// -----------------------------------------------------------------------------
// ArcGIS services
// -----------------------------------------------------------------------------

// U.S. Energy Information Administration (EIA) power plants.
export const POWER_PLANTS_URL =
  "https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Power_Plants_in_the_US/FeatureServer/0";

// Bureau of Land Management (BLM) Surface Management Agency layer.
// Layer 22 contains National Park Service lands.
export const NPS_PARKS_URL =
  "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/22";

// Bureau of Indian Affairs (BIA) Agency and Regional Offices.
export const BIA_OFFICES_URL =
  "https://services1.arcgis.com/UxqqIfhng71wUT9x/arcgis/rest/services/BIA_Agency_and_Regional_Offices/FeatureServer/0";