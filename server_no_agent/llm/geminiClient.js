import {
  assertAllowedGeminiModel,
  assertGeminiConfigured,
  config,
} from "../config.js";
import { GEMINI_TOOL_ROUTER_SYSTEM_INSTRUCTION } from "../prompts/geminiPrompts.js";

export async function geminiGenerateToolCall({ prompt, functionDeclarations, model }) {
  assertGeminiConfigured();

  const modelToUse = model || config.gemini.defaultModel;
  assertAllowedGeminiModel(modelToUse);

  const url = new URL(
    `models/${encodeURIComponent(modelToUse)}:generateContent`,
    `${config.gemini.baseUrl.replace(/\/$/, "")}/`
  );
  url.searchParams.set("key", config.gemini.apiKey);

  const payload = {
    systemInstruction: {
      parts: [{ text: GEMINI_TOOL_ROUTER_SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    tools: [{ functionDeclarations }],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? `Gemini request failed: HTTP ${response.status}`;
    throw new Error(message);
  }

  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const functionPart = parts.find((part) => part.functionCall);

  if (functionPart?.functionCall) {
    const { name, args = {} } = functionPart.functionCall;
    console.log(`[gemini] chose tool "${name}" with args:`, args);

    return {
      type: "tool_call",
      name,
      args,
      source: "gemini",
      model: modelToUse,
    };
  }

  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return {
    type: "text",
    text,
    source: "gemini",
    model: modelToUse,
  };
}