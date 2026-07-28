import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
// 1. Mock SAP database tool conforming to ADK Function Spec
import { z } from "zod";
import { FunctionTool, LlmAgent, Runner, InMemorySessionService } from "@google/adk";

const app = express();

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());



// 1. SAP asset tool, built as a proper ADK FunctionTool
const getSapAssetTool = new FunctionTool({
  name: "get_sap_asset_location",
  description: "Fetches GPS coordinates and status for an SAP Asset ID.",
  parameters: z.object({
    assetId: z.string().describe("The SAP Asset ID"),
  }),
  execute: async ({ assetId }) => {
    console.log(`[MCP Server] Querying SAP asset: ${assetId}`);
    return {
      assetId: assetId || "PUMP-101",
      status: "Needs Maintenance",
      latitude: 34.0522,
      longitude: -118.2437,
      type: "High-Pressure Water Pump",
    };
  },
});
// 2. Initialize ADK Agent
const gisAgent = new LlmAgent({
  name: "gis_adk_assistant",
  model: "gemini-2.5-flash",
  instruction: `You are an enterprise GIS AI Assistant.
  When asked about an SAP asset:
  1. Call get_sap_asset_location to fetch coordinates.
  2. Provide a concise summary including the asset status and coordinates.`,
  tools: [getSapAssetTool],
});

// 3. Initialize ADK Session Service & Runner
const APP_NAME = "gis-app";
const sessionService = new InMemorySessionService();
const runner = new Runner({
  appName: APP_NAME,
  agent: gisAgent,
  sessionService: sessionService,
});

// Helper function to guarantee session existence
async function ensureSession(appName, userId, sessionId) {
  const existing = await sessionService.getSession({ appName, userId, sessionId });
  if (!existing) {
    console.log(`[Session] Creating new session: ${sessionId} for user: ${userId}`);
    await sessionService.createSession({ appName, userId, sessionId });
  }
}

// 4. API Chat Endpoint
app.post("/api/chat", async (req, res) => {
  console.log(`[API Received]:`, req.body);
  try {
    const { prompt, userId = "gis-user", sessionId = "default-session" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt' in request body." });
    }

    // Ensure session exists in InMemorySessionService prior to agent run
    await ensureSession(APP_NAME, userId, sessionId);

    // Format newMessage as a Content object expected by ADK
    const formattedMessage = {
      role: "user",
      parts: [{ text: prompt }],
    };

    // Execute agent run stream via Runner
    const runStream = runner.runAgent
      ? runner.runAgent({ userId, sessionId, newMessage: formattedMessage })
      : runner.runAsync({ userId, sessionId, newMessage: formattedMessage });

    let finalResponseText = "";

    // Consume ADK runner event stream
    for await (const event of runStream) {
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.text) {
            finalResponseText += part.text;
          }
        }
      }
    }

    console.log(`[ADK Response]:`, finalResponseText);

    // Return both text response and structured coordinates for ArcGIS client
    res.json({
      success: true,
      result: finalResponseText,
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
        label: "PUMP-101",
      },
    });
  } catch (err) {
    console.error("[Agent Error]:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`GIS Agent Backend running at http://localhost:${PORT}`);
  console.log(`Test endpoint active at http://localhost:${PORT}/api/chat`);
  console.log(`========================================`);
});