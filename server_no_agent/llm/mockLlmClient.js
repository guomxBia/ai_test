import { deterministicToolCall } from "../services/deterministicRouter.js";

// This gives the local deterministic implementation the same output contract
// as the Gemini client. It is not a real LLM and makes no network request.
export async function mockGenerateToolCall(prompt) {
  return deterministicToolCall(prompt);
}