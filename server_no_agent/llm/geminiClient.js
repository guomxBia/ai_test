// server/llm/geminiClient.js
//
// Gemini function-calling utility.
//
// Responsibilities:
// - Send a prompt plus function declarations to Gemini.
// - Return whichever tool call Gemini chose (name + args), or
//   plain text if Gemini did not choose a tool.
//
// This module does not know about MCP or HTTP routes.

import { GEMINI_API_URL, GEMINI_PRO_MODEL } from "../config.js";

/**
 * MCP tool inputSchemas use standard lowercase JSON Schema.
 * Gemini's function-calling schema expects uppercase type enums
 * and doesn't support `additionalProperties`.
 */
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;

  const { additionalProperties, ...rest } = schema;
  const converted = { ...rest };

  if (typeof converted.type === "string") {
    converted.type = converted.type.toUpperCase();
  }

  if (converted.properties) {
    converted.properties = Object.fromEntries(
      Object.entries(converted.properties).map(([key, value]) => [key, toGeminiSchema(value)])
    );
  }

  if (converted.items) {
    converted.items = toGeminiSchema(converted.items);
  }

  return converted;
}

export function mcpToolsToGeminiDeclarations(mcpTools) {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: toGeminiSchema(tool.inputSchema),
  }));
}

export async function geminiGenerateToolCall(prompt, functionDeclarations) {
  const requestPayload = {
    model: GEMINI_PRO_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ functionDeclarations }],
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const part = candidate?.content?.parts?.[0];

  if (part?.functionCall) {
    const { name, args } = part.functionCall;
    console.log(`[gemini] chose tool "${name}" with args:`, args);
    return { type: "tool_call", name, args };
  }

  return { type: "text", text: part?.text?.trim() ?? "" };
}