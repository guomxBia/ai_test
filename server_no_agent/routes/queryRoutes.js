// server/routes/queryRoutes.js
import { Router } from "express";

import { listTools, callTool } from "../clients/mcpClient.js";
import { ollamaGenerateQueryPath } from "../llm/ollamaClient.js";
import { geminiGenerateToolCall, mcpToolsToGeminiDeclarations } from "../llm/geminiClient.js";
import { parseNiogemsPath, parseUsgsQuery } from "../llm/responseParsers.js";
import { SYSTEM_PROMPT_NIOGEMS, SYSTEM_PROMPT_USGSTURB } from "../llm/systemPrompts.js";
import { CODELLAMA_13_MODEL } from "../config.js";

const router = Router();

const TARGET_CONFIG = {
  niogems: {
    toolName: "query_niogems_wells",
    systemPrompt: SYSTEM_PROMPT_NIOGEMS,
    parseOllamaResponse: parseNiogemsPath,
  },
  usgs: {
    toolName: "query_usgs_turbines",
    systemPrompt: SYSTEM_PROMPT_USGSTURB,
    parseOllamaResponse: parseUsgsQuery,
  },
};

/** GET /api/tools — mostly for debugging from the browser or a console. */
router.get("/api/tools", async (req, res) => {
  try {
    const tools = await listTools();
    res.json({ tools });
  } catch (error) {
    console.error("[routes] Failed to list MCP tools:", error);
    res.status(502).json({ error: "Failed to reach MCP tool server." });
  }
});

/**
 * POST /api/query
 * body: { prompt, provider: "ollama" | "gemini", target?: "niogems" | "usgs" }
 * "target" is required for ollama, ignored for gemini (which picks the tool itself).
 */
router.post("/api/query", async (req, res) => {
  const { prompt, provider, target } = req.body ?? {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A non-empty 'prompt' is required." });
  }

  if (provider !== "ollama" && provider !== "gemini") {
    return res.status(400).json({ error: "'provider' must be 'ollama' or 'gemini'." });
  }

  try {
    if (provider === "ollama") {
      const config = TARGET_CONFIG[target];
      if (!config) {
        return res.status(400).json({ error: "'target' must be 'niogems' or 'usgs'." });
      }

      const rawPath = await ollamaGenerateQueryPath(
        prompt,
        CODELLAMA_13_MODEL,
        config.systemPrompt,
        `${target} (Ollama)`
      );

      const args = config.parseOllamaResponse(rawPath);
      const data = await callTool(config.toolName, args);

      return res.json({ provider, target, toolName: config.toolName, args, data });
    }

    // provider === "gemini": let the model choose which tool to call
    const mcpTools = await listTools();
    const declarations = mcpToolsToGeminiDeclarations(mcpTools);
    const result = await geminiGenerateToolCall(prompt, declarations);

    if (result.type === "text") {
      return res.json({ provider, type: "text", text: result.text });
    }

    const data = await callTool(result.name, result.args);

    return res.json({ provider, type: "tool_call", toolName: result.name, args: result.args, data });
  } catch (error) {
    console.error("[routes] /api/query failed:", error);
    res.status(500).json({ error: error.message ?? "Query failed." });
  }
});

export default router;