// server/config.js
import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 5050);

export const OLLAMA_API_URL = process.env.OLLAMA_API_URL ?? "http://localhost:11434/api";
export const CODELLAMA_13_MODEL = process.env.CODELLAMA_MODEL ?? "codellama:13b-instruct-q4_K_M";

export const GEMINI_API_URL = process.env.GEMINI_API_URL ?? "https://localhost:8443/GeminiProxy";
export const GEMINI_PRO_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export const MCP_SERVER_SSE_URL = process.env.MCP_SERVER_SSE_URL ?? "http://localhost:6060/sse";