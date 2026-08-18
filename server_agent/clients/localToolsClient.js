//server\clients\localToolsClient.js
//server\clients\localToolsStdioMcpClient.js
import { LocalToolsStdioMcpClient } from "./LocalToolsStdioMcpClient.js";

export const localToolsClient = new LocalToolsStdioMcpClient({
  requestTimeoutMs: 20_000,
});