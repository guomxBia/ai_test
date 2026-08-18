/**
 * aiConfigToolSchemas.js
 */

// --- TOOL SCHEMAS (For Gemini Function Calling) ---
export const NIOGEMS_TOOL_DEFINITION = {
  name: "query_niogems_wells",
  description: "Search oil and gas wells from the Niogems database by operator, lease, field, well number, or status.",
  parameters: {
    type: "OBJECT",
    properties: {
      leaseName: { type: "STRING", description: "Name of the oil/gas lease" },
      operatorName: { type: "STRING", description: "Name of the operating company (e.g. Enbridge)" },
      status: { type: "STRING", description: "Well status (e.g. active, shut-in)" },
      fieldName: { type: "STRING", description: "Field name (e.g. Lake Enaton)" },
      wellNumber: { type: "STRING", description: "Specific well identification number" },
      page: { type: "NUMBER", description: "Page number for pagination", default: 1 },
      pageSize: { type: "NUMBER", description: "Results per page", default: 10 }
    }
  }
};

export const USGS_TOOL_DEFINITION = {
  name: "query_usgs_turbines",
  description: "Search U.S. Wind Turbine Database (USWTDB) records by state, county, manufacturer, capacity, or year.",
  parameters: {
    type: "OBJECT",
    properties: {
      t_state: { type: "STRING", description: "Two-letter US state abbreviation (e.g. IA, TX)" },
      t_county: { type: "STRING", description: "County name (e.g. Story County)" },
      t_manu: { type: "STRING", description: "Turbine manufacturer (e.g. Vestas, GE Wind)" },
      t_cap: { type: "NUMBER", description: "Turbine rated capacity in kW" },
      cap_operator: { type: "STRING", description: "Comparison operator for capacity: 'gt' (greater than), 'lt' (less than), or 'eq' (equal)", default: "eq" },
      t_hh: { type: "NUMBER", description: "Turbine hub height in meters" },
      hh_operator: { type: "STRING", description: "Comparison operator for hub height: 'gt', 'lt', or 'eq'", default: "eq" },
      p_year: { type: "NUMBER", description: "Project operational year" },
      sort_order: { type: "STRING", description: "Sort column and direction (e.g. 'p_year.desc')" },
      limit: { type: "NUMBER", description: "Number of records to return", default: 10 },
      offset: { type: "NUMBER", description: "Record offset for pagination", default: 0 }
    }
  }
};