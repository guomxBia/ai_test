// src/chat.js

/**
 * Initialize chat UI and wire up events.
 *
 * params:
 * - sendButtonId: ID of the "Send" button
 * - inputId: ID of the textarea/input for user prompt
 * - outputId: ID of the textarea for displaying AI output
 * - clearButtonId: ID of the "Clear" button
 * - onLocationUpdate: function({ latitude, longitude, label }) called when AI returns location
 * - onClear: function() called when user clicks Clear
 */
import { API_BASE_URL } from "./config.js";
export function initChatUI({
  sendButtonId,
  inputId,
  outputId,
  clearButtonId,
  onLocationUpdate,
  onClear,
}) {
  const sendBtn = document.getElementById(sendButtonId);
  const inputEl = document.getElementById(inputId);
  const outputEl = document.getElementById(outputId);
  const clearBtn = document.getElementById(clearButtonId);

  if (!sendBtn || !inputEl || !outputEl || !clearBtn) {
    console.error("Chat UI elements not found. Check your IDs.");
    return;
  }

  async function sendPrompt() {
    const prompt = inputEl.value.trim();
    if (!prompt) {
      outputEl.value = "Please enter a question.";
      return;
    }

    try {
      outputEl.value = "Sending prompt to GIS Agent server...\n";
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from server:", data);

      // Show text response in chat output
      outputEl.value += `\nResponse:\n${data.result || "[No text result]"}`;

      // If location present, notify the map side
      if (data.location && onLocationUpdate) {
        onLocationUpdate({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          label: data.location.label,
        });
      }
    } catch (err) {
      console.error("Error executing request:", err);
      outputEl.value += `\nError: ${err.message}`;
    }
  }

  function clearChat() {
    inputEl.value = "";
    outputEl.value = "";
    if (onClear) onClear();
  }

  sendBtn.addEventListener("click", sendPrompt);
  clearBtn.addEventListener("click", clearChat);
}