// routes.js
import { Router } from "express";
import { getRunner, getEnsureSession, getAppName } from "./agents/agentRegistry.js";
import { getWells } from "./db/dbtables.js";
import { FederalGisHttpMcpClient } from "./clients/FederalGisHttpMcpClient.js";
import { localToolsClient } from "./clients/localToolsClient.js";

const router = Router();

router.post("/api/chat", async (req, res) => {
  console.log(`[API Received]:`, req.body);
  try {
    const { prompt, userId = "gis-user", sessionId = "default-session" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request body." });
    }

    const APP_NAME = await getAppName();
    const ensureSession = await getEnsureSession();
    const runner = await getRunner();

    await ensureSession(APP_NAME, userId, sessionId);

    const formattedMessage = {
      role: "user",
      parts: [{ text: prompt }],
    };

    const runStream = runner.runAgent
      ? runner.runAgent({ userId, sessionId, newMessage: formattedMessage })
      : runner.runAsync({ userId, sessionId, newMessage: formattedMessage });

    let finalResponseText = "";
    let selectedLocation = null;
    let lastEvent = null;

    for await (const event of runStream) {
      lastEvent = event;
      console.log("[ADK Event]:", JSON.stringify(event, null, 2));

      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            finalResponseText += part.text;
          }

          // If ADK surfaces tool results as JSON text, try to parse firstLocation from it
          if (!selectedLocation && part.text && part.text.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(part.text);
              if (parsed.firstLocation) {
                selectedLocation = parsed.firstLocation;
              }
            } catch {
              // not JSON, ignore
            }
          }

          // If ADK surfaces data separately
          if (!selectedLocation && part.data && typeof part.data === "object") {
            if (part.data.firstLocation) {
              selectedLocation = part.data.firstLocation;
            }
          }

          // If ADK surfaces the tool result as a functionResponse event
          // (this is the actual shape our tools return it in), pull
          // firstLocation from part.functionResponse.response.firstLocation
          if (!selectedLocation && part.functionResponse?.response?.firstLocation) {
            selectedLocation = part.functionResponse.response.firstLocation;
          }
        }
      }
    }

    console.log(`[ADK Response]:`, finalResponseText);

    const location =
      selectedLocation || {
        latitude: 34.0522,
        longitude: -118.2437,
        label: "PUMP-101",
      };

    res.json({
      success: true,
      result: finalResponseText || "[No text result]",
      location,
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
    const client = new FederalGisHttpMcpClient();
    const response = await client.queryPowerPlants({
      state: "Michigan",
      maxFeatures: 5,
    });
    res.json(response); // { where, count, features }
  } catch (err) {
    console.error("[Test PowerPlants Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// Test route for the local-only stdio MCP server (local_data files, local wells DB).
router.get("/api/test-local-wells", async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);

    // Keep the route input aligned with your MCP server's 1–100 validation.
    const limit =
      Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 100
        ? rawLimit
        : 10;

    const response = await localToolsClient.callTool("query_local_wells", {
      limit,
    });

    const content = response.content ?? response.result?.content ?? [];
    let parsed = null;

    for (const part of content) {
      if (part.type === "text" && part.text) {
        try {
          parsed = JSON.parse(part.text);
          break;
        } catch {
          // The tool may return plain text instead of JSON.
        }
      }
    }

    return res.json(parsed ?? { raw: response });
  } catch (err) {
    console.error("[Test Local Wells Error]:", err);

    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal Server Error",
    });
  }
});

router.get("/api/test-local-files", async (req, res) => {
  try {
    const response = await localToolsClient.callTool(
      "list_local_directory",
      {}
    );

    const content = response.content ?? response.result?.content ?? [];
    let parsed = null;

    for (const part of content) {
      if (part.type === "text" && part.text) {
        try {
          parsed = JSON.parse(part.text);
          break;
        } catch {
          // The tool may return plain text instead of JSON.
        }
      }
    }

    return res.json(parsed ?? { raw: response });
  } catch (err) {
    console.error("[Test Local Files Error]:", err);

    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal Server Error",
    });
  }
});

export default router;