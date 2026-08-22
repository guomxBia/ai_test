// MCP tool schemas are standard JSON Schema. Gemini function declarations use
// uppercase type strings and do not accept additionalProperties or $schema.
export function toGeminiSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;

  const { additionalProperties, $schema, definitions, $defs, ...rest } = schema;
  const converted = { ...rest };

  if (typeof converted.type === "string") {
    converted.type = converted.type.toUpperCase();
  }

  if (converted.properties && typeof converted.properties === "object") {
    converted.properties = Object.fromEntries(
      Object.entries(converted.properties).map(([key, value]) => [
        key,
        toGeminiSchema(value),
      ])
    );
  }

  if (converted.items) {
    converted.items = toGeminiSchema(converted.items);
  }

  if (Array.isArray(converted.anyOf)) {
    converted.anyOf = converted.anyOf.map(toGeminiSchema);
  }

  if (Array.isArray(converted.oneOf)) {
    converted.oneOf = converted.oneOf.map(toGeminiSchema);
  }

  return converted;
}

export function mcpToolsToGeminiDeclarations(mcpTools) {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    parameters: toGeminiSchema(tool.inputSchema ?? { type: "object", properties: {} }),
  }));
}