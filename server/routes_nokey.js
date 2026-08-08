// routes.js
import { Router } from "express";
import { getRunner, getEnsureSession, getAppName } from "./agents.js";
import { getWells } from "./dbtables.js";//
//import { arcgisStdioMcpClient } from "./arcgisStdioMcpClient.js";
const router = Router();

// routes.js
import { arcgisStdioMcpClient } from "./libs/arcgisStdioMcpClient.js";

router.post("/api/chat", async (req, res) => {
  console.log(`[API Received]:`, req.body);
  try {
    const { prompt } = req.body;

    // Very simple heuristic: if prompt mentions "power plants in Michigan", call MCP directly.
    if (prompt.toLowerCase().includes("power plants in michigan")) {
      const client = new arcgisStdioMcpClient();
      const response = await client.callTool("query_power_plants_us_eia", {
        state: "Michigan",
        maxFeatures: 5,
      });
      client.close();

      const content = response.content || [];
      const text = content[0]?.text || "";
      const parsed = JSON.parse(text);

      const first = parsed.features[0];
      const attrs = first.attributes;
      const location = {
        latitude: attrs.Latitude,
        longitude: attrs.Longitude,
        label: attrs.Plant_Name,
      };

      // Build a simple summary
      const result = text; // or format it nicely

      return res.json({
        success: true,
        result,
        location,
      });
    }

    // Otherwise, fallback or return error while LLM is offline
    return res.json({
      success: false,
      result: "LLM agent is temporarily unavailable due to API key issues.",
      location: null,
    });
  } catch (err) {
    console.error("[Agent Error]:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// /api/loadwells unchanged
router.get("/api/loadwells", (req, res) => {
  try {
    const wells = getWells();
    res.json({ success: true, wells });
  } catch (err) {
    console.error("[LoadWells Error]:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});



router.get("/api/test-powerplants", async (req, res) => {
  try {
    const client = new arcgisStdioMcpClient();
    const response = await client.callTool("query_power_plants_us_eia", {
  state: "Michigan",
  // no plantNameLike
  maxFeatures: 5,
});
    client.close();
    res.json(response);
  } catch (err) {
    console.error("[Test PowerPlants Error]:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;