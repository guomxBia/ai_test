import { config } from "../config.js";
import { geminiGenerateToolCall } from "../llm/geminiClient.js";
import { mockGenerateToolCall } from "../llm/mockLlmClient.js";
import { mcpToolsToGeminiDeclarations } from "../llm/schemaAdapter.js";
import { callTool, listTools } from "../mcp/mcpClient.js";
import { validateToolCall } from "../utils/validateToolCall.js";

const SUPPORTED_PROVIDERS = new Set(["mock", "gemini"]);

export async function processQuery({ prompt, provider, model }) {
  const selectedProvider = provider ?? config.llm.defaultProvider;

  if (!SUPPORTED_PROVIDERS.has(selectedProvider)) {
    throw new Error(`Unsupported provider "${selectedProvider}".`);
  }

  // The tool list is needed for validation in every mode and for Gemini's
  // function declarations in Gemini mode.
  const tools = await listTools();

  let decision;

  if (selectedProvider === "mock") {
    decision = await mockGenerateToolCall(prompt);
  } else {
    const declarations = mcpToolsToGeminiDeclarations(tools);
    decision = await geminiGenerateToolCall({
      prompt,
      functionDeclarations: declarations,
      model,
    });
  }

  if (decision.type === "text") {
    return {
      provider: selectedProvider,
      type: "text",
      source: decision.source,
      model: decision.model,
      text: decision.text,
    };
  }

  const { name, args } = validateToolCall({
    name: decision.name,
    args: decision.args,
    tools,
  });

  const data = await callTool(name, args);

  return {
    provider: selectedProvider,
    type: "tool_call",
    source: decision.source,
    model: decision.model,
    toolName: name,
    args,
    data,
  };
}