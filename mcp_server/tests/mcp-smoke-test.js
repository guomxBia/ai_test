//mcp_server\tests\mcp-smoke-test.js
import { FederalGisHttpMcpClient } from "./FederalGisHttpMcpClient.js";

async function main() {
  const client = new FederalGisHttpMcpClient();

  try {
    console.log("Listing tools from HTTP MCP server...");
    const tools = await client.listTools();
    console.log("Available tools:", tools.map((t) => t.name));

    console.log("Calling query_power_plants_us_eia via HTTP MCP...");
    const result = await client.callTool("query_power_plants_us_eia", {
      state: "MI",
      maxFeatures: 5,
    });

    const content = result.content || [];
    const text = content[0]?.text || "";
    console.log("Raw tool text:", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("Failed to parse JSON; raw text only.");
      return;
    }

    console.log("Parsed result where:", parsed.where);
    console.log("Feature count:", parsed.count);
    console.log("First feature:", parsed.features[0]?.attributes);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("[mcp-smoke-test Error]:", err);
  process.exit(1);
});
