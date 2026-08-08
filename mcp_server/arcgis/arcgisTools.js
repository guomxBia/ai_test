import {
  BIA_OFFICES_URL,
  NPS_PARKS_URL,
  POWER_PLANTS_URL,
} from "../config.js";

const US_STATE_BY_ABBREV = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

/** EIA layer stores full state names (e.g. "Michigan"), not abbreviations. */
function resolvePowerPlantState(stateInput) {
  const raw = String(stateInput).trim();
  if (raw.length === 2) {
    return US_STATE_BY_ABBREV[raw.toUpperCase()] ?? raw;
  }
  return raw.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

async function arcgisQuery({ url, where = "1=1", outFields = "*", maxFeatures = 10 }) {
  const params = new URLSearchParams({
    f: "json",
    where,
    outFields,
    resultRecordCount: String(maxFeatures),
    returnGeometry: "true",
  });

  const fullUrl = `${url}/query?${params.toString()}`;
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`ArcGIS query failed: HTTP ${response.status}`);
  }

  const json = await response.json();
  if (!json.features) {
    return { features: [], raw: json };
  }

  const features = json.features.map((f) => ({
    attributes: f.attributes,
    geometry: f.geometry,
  }));

  return { features, raw: json };
}

export const POWER_PLANTS_TOOL = {
  name: "query_power_plants_us_eia",
  description:
    "Query U.S. power plants from the EIA feature layer. You can filter by state or plant name.",
  inputSchema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        description:
          "Optional state: two-letter abbreviation (e.g. 'MI') or full name (e.g. 'Michigan').",
      },
      plantNameLike: {
        type: "string",
        description: "Optional partial plant name filter. Used with LIKE '%value%'.",
      },
      maxFeatures: {
        type: "number",
        default: 10,
        description: "Maximum number of features to return.",
      },
    },
  },
};

export const NPS_PARKS_TOOL = {
  name: "query_nps_parks",
  description:
    "Query National Park Service (NPS) units from the BLM map service layer. Filter by unit name.",
  inputSchema: {
    type: "object",
    properties: {
      unitNameLike: {
        type: "string",
        description: "Optional partial unit name filter. Used with LIKE '%value%'.",
      },
      maxFeatures: {
        type: "number",
        default: 10,
        description: "Maximum number of features to return.",
      },
    },
  },
};

export const BIA_OFFICES_TOOL = {
  name: "query_bia_agency_offices",
  description:
    "Query BIA Agency and Regional Offices feature layer. Filter by agency name or region.",
  inputSchema: {
    type: "object",
    properties: {
      agencyNameLike: {
        type: "string",
        description: "Optional partial agency/office name filter. Used with LIKE '%value%'.",
      },
      regionLike: {
        type: "string",
        description: "Optional partial region name filter.",
      },
      maxFeatures: {
        type: "number",
        default: 10,
        description: "Maximum number of features to return.",
      },
    },
  },
};

export const ARCGIS_MCP_TOOLS = [POWER_PLANTS_TOOL, NPS_PARKS_TOOL, BIA_OFFICES_TOOL];

/**
 * Run an ArcGIS MCP tool by name. Returns MCP tool result content payload fields.
 */
export async function executeArcgisMcpTool(name, args = {}) {
  if (name === "query_power_plants_us_eia") {
    const whereParts = [];
    if (args.state) {
      whereParts.push(`State = '${sqlEscape(resolvePowerPlantState(args.state))}'`);
    }
    if (args.plantNameLike) {
      whereParts.push(`Plant_Name LIKE '%${sqlEscape(args.plantNameLike)}%'`);
    }
    const where = whereParts.length ? whereParts.join(" AND ") : "1=1";
    const { features } = await arcgisQuery({
      url: POWER_PLANTS_URL,
      where,
      outFields: "*",
      maxFeatures: args.maxFeatures || 10,
    });
    return { where, features };
  }

  if (name === "query_nps_parks") {
    let where = "1=1";
    if (args.unitNameLike) {
      where = `UNIT_NAME LIKE '%${sqlEscape(args.unitNameLike)}%'`;
    }
    const { features } = await arcgisQuery({
      url: NPS_PARKS_URL,
      where,
      outFields: "*",
      maxFeatures: args.maxFeatures || 10,
    });
    return { where, features };
  }

  if (name === "query_bia_agency_offices") {
    const whereParts = [];
    if (args.agencyNameLike) {
      whereParts.push(`AGENCY_NAME LIKE '%${sqlEscape(args.agencyNameLike)}%'`);
    }
    if (args.regionLike) {
      whereParts.push(`REGION LIKE '%${sqlEscape(args.regionLike)}%'`);
    }
    const where = whereParts.length ? whereParts.join(" AND ") : "1=1";
    const { features } = await arcgisQuery({
      url: BIA_OFFICES_URL,
      where,
      outFields: "*",
      maxFeatures: args.maxFeatures || 10,
    });
    return { where, features };
  }

  throw new Error(`Unknown tool: ${name}`);
}

export function formatArcgisToolResult(where, features) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ where, count: features.length, features }, null, 2),
      },
    ],
  };
}
