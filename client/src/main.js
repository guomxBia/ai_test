import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";

// 1. Initialize ArcGIS Map
const map = new Map({ basemap: "topo-vector" });
const view = new MapView({
  container: "viewDiv",
  map: map,
  center: [-118.2437, 34.0522],
  zoom: 10,
});

// 2. Execute ADK Request via Backend
async function runAgentWorkflow() {
  try {
    console.log("Sending prompt to GIS Agent server...");
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Where is SAP asset PUMP-101 located and what is its status?" }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    console.log("Response from server:", data);

    // Update map canvas if location data is returned
    if (data.location) {
      const point = new Point({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });

      const graphic = new Graphic({
        geometry: point,
        symbol: { type: "simple-marker", color: "red", size: "12px" },
        attributes: { label: data.location.label },
      });

      view.graphics.removeAll();
      view.graphics.add(graphic);
      await view.goTo({ center: point, zoom: 14 });
    }

    alert(data.result);
  } catch (err) {
    console.error("Error executing request:", err);
  }
}

document.getElementById("runBtn").addEventListener("click", runAgentWorkflow);