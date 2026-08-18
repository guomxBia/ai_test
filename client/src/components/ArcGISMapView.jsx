// src/components/ArcGISMapView.jsx
import { useEffect, useImperativeHandle, useRef } from "react";
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Graphic from "@arcgis/core/Graphic.js";
import Point from "@arcgis/core/geometry/Point.js";

export default function ArcGISMapView({ ref }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    const map = new Map({ basemap: "topo-vector" });

    const view = new MapView({
      container: containerRef.current,
      map,
      center: [-118.2437, 34.0522],
      zoom: 10,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      showLocation({ latitude, longitude, label }) {
        const view = viewRef.current;
        if (!view) return;

        const point = new Point({ latitude, longitude });
        const graphic = new Graphic({
          geometry: point,
          symbol: { type: "simple-marker", color: "red", size: "12px" },
          attributes: { label },
        });

        view.graphics.removeAll();
        view.graphics.add(graphic);
        view.goTo({ center: point, zoom: 14 });
      },
      clearGraphics() {
        viewRef.current?.graphics.removeAll();
      },
    }),
    []
  );

  return <div ref={containerRef} className="map-container" />;
}