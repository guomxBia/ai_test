// src/mapviewer.js
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";

let view;

/**
 * Initialize the ArcGIS map in the given container ID.
 */
export function initMap(containerId) {
  const map = new Map({ basemap: "topo-vector" });

  view = new MapView({
    container: containerId,
    map: map,
    center: [-118.2437, 34.0522], // initial center (LA by your original code)
    zoom: 10,
  });

  return view;
}

/**
 * Show a single location point on the map and zoom to it.
 * location: { latitude, longitude, label }
 */
export async function showLocationOnMap({ latitude, longitude, label }) {
  if (!view) {
    console.error("MapView is not initialized.");
    return;
  }

  const point = new Point({ latitude, longitude });

  const graphic = new Graphic({
    geometry: point,
    symbol: { type: "simple-marker", color: "red", size: "12px" },
    attributes: { label },
  });

  view.graphics.removeAll();
  view.graphics.add(graphic);
  await view.goTo({ center: point, zoom: 14 });
}

/**
 * Clear all graphics from the map.
 */
export function clearMapGraphics() {
  if (!view) return;
  view.graphics.removeAll();
}