// src/pages/NoAgentTestPage.jsx
import { useRef } from "react";
import ArcGISMapView from "../components/ArcGISMapView.jsx";
import NoAgentQueryPanel from "../components/NoAgentQueryPanel.jsx";
import ResizablePanels from "../components/ResizablePanels.jsx";

export default function NoAgentTestPage() {
  const mapRef = useRef(null);

  return (
    <ResizablePanels
      left={<ArcGISMapView ref={mapRef} />}
      right={
        <NoAgentQueryPanel
          title="MCP Client + LLM Query (no agent)"
          onLocationUpdate={(loc) => mapRef.current?.showLocation(loc)}
          onClear={() => mapRef.current?.clearGraphics()}
        />
      }
    />
  );
}