import { GoogleGenAI } from "@google/genai";
import { assertAllowedGeminiModel, assertGeminiConfigured, config } from "../config.js";
import { GEMINI_TOOL_ROUTER_SYSTEM_INSTRUCTION } from "../prompts/geminiPrompts.js";

export async function geminiGenerateToolCall({ prompt, functionDeclarations, model }) {
  assertGeminiConfigured();

  const modelToUse = model || config.gemini.defaultModel;
  assertAllowedGeminiModel(modelToUse);

  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey,
                             // Pass httpOptions if using an internal reverse proxy/gateway
                             // httpOptions: { baseUrl: config.gemini.baseUrl  }
                             });

  const response = await ai.models.generateContent({
    model: modelToUse,
    contents: prompt,
    config: {
      systemInstruction: GEMINI_TOOL_ROUTER_SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations }],
    },
  });

  const functionCall = response.functionCalls?.[0];

  if (functionCall) {
    const { name, args = {} } = functionCall;
    console.log(`[gemini] chose tool "${name}" with args:`, args);

    return {
      type: "tool_call",
      name,
      args,
      source: "gemini",
      model: modelToUse,
    };
  }

  return {
    type: "text",
    text: response.text ?? "",
    source: "gemini",
    model: modelToUse,
  };
}