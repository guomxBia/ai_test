import { Router } from "express";

import { config } from "../config.js";
import { listTools } from "../mcp/mcpClient.js";
import { processQuery } from "../services/queryService.js";

const router = Router();

router.get("/api/tools", async (req, res, next) => {
  try {
    const tools = await listTools();
    res.json({ tools });
  } catch (error) {
    next(error);
  }
});

router.post("/api/query", async (req, res, next) => {
  try {
    const { prompt, provider, model } = req.body ?? {};

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A non-empty 'prompt' is required." });
    }

    if (prompt.length > config.llm.maxPromptLength) {
      return res.status(400).json({
        error: `Prompt is too long. Maximum length is ${config.llm.maxPromptLength} characters.`,
      });
    }

    if (provider !== undefined && !["mock", "gemini"].includes(provider)) {
      return res.status(400).json({
        error: "'provider' must be 'mock' or 'gemini'.",
      });
    }

    if (model !== undefined && typeof model !== "string") {
      return res.status(400).json({ error: "'model' must be a string when supplied." });
    }

    const result = await processQuery({
      prompt: prompt.trim(),
      provider,
      model,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;