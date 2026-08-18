// src/api/agentClient.js
import { AGENT_SERVER_URL } from "../config.js";

export async function sendToAgentServer(prompt) {
  const response = await fetch(`${AGENT_SERVER_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Agent server returned HTTP ${response.status}`);
  }

  const data = await response.json();

  return {
    resultText: data.result || "[No text result]",
    location: data.location
      ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          label: data.location.label,
        }
      : null,
  };
}