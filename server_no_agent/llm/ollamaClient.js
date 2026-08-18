// server/llm/ollamaClient.js
//
// Ollama text-based prompting utility.
//
// Responsibilities:
// - Send a system + user prompt to a local Ollama model.
// - Return the raw path/query string the model generated.
//
// This module does not know about MCP tools or HTTP routes.

import { OLLAMA_API_URL } from "../config.js";

export async function ollamaGenerateQueryPath(prompt, model, systemPrompt, name) {
  console.log(`[ollama] ${name} using ${model}`);

  const response = await fetch(`${OLLAMA_API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawResponse = data.message?.content?.trim() ?? "";

  let finalQueryString = rawResponse.replace(/^['"]|['"]$/g, "");

  if (!finalQueryString.startsWith("/") && !finalQueryString.startsWith("?")) {
    finalQueryString = `/${finalQueryString}`;
  }

  return finalQueryString;
}