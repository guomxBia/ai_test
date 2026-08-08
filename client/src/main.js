// src/main.js
import {
  initMap,
  showLocationOnMap,
  clearMapGraphics,
} from "./mapviewer.js";
import { initChatUI } from "./chat.js";

window.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize ArcGIS map on the left side
  initMap("mapContainer");

  // 2. Initialize chat UI on the right side and hook map callbacks
  initChatUI({
    sendButtonId: "chatSendBtn",
    inputId: "chatInput",
    outputId: "chatOutput",
    clearButtonId: "chatClearBtn",
    onLocationUpdate: (location) => {
      // Update map when AI returns coordinates
      showLocationOnMap(location);
    },
    onClear: () => {
      // Clear map graphics when user clears chat
      clearMapGraphics();
    },
  });
});