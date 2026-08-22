//server_no_agent\config.js
import "dotenv/config";

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCsv(value, fallback = "") {
  return String(value ?? fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: parsePositiveInteger(process.env.PORT, 5050),

  llm: {
    defaultProvider: process.env.LLM_PROVIDER ?? "mock",
    maxPromptLength: parsePositiveInteger(process.env.MAX_PROMPT_LENGTH, 4000),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    baseUrl:
      process.env.GEMINI_API_URL ??
      "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    allowedModels: parseCsv(
      process.env.GEMINI_ALLOWED_MODELS,
      process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
    ),
  },

  mcp: {
    sseUrl: process.env.MCP_SERVER_SSE_URL ?? "http://localhost:6060/sse",
  },

  limits: {
    niogemsPageSize: parsePositiveInteger(process.env.MAX_NIOGEMS_PAGE_SIZE, 100),
    usgsLimit: parsePositiveInteger(process.env.MAX_USGS_LIMIT, 500),
  },
};

export function assertGeminiConfigured() {
  if (!config.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to server/.env before using provider 'gemini'.");
  }
}

export function assertAllowedGeminiModel(model) {
  if (!config.gemini.allowedModels.includes(model)) {
    throw new Error(`Gemini model "${model}" is not in GEMINI_ALLOWED_MODELS.`);
  }
}