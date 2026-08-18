// src/pages/AgentTestPage.jsx
import { useRef } from "react";
import ArcGISMapView from "../components/ArcGISMapView.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import ResizablePanels from "../components/ResizablePanels.jsx";
import { sendToAgentServer } from "../api/agentClient.js";

export default function AgentTestPage() {
  const mapRef = useRef(null);

  return (
    <ResizablePanels
      left={<ArcGISMapView ref={mapRef} />}
      right={
        <ChatPanel
          title="GIS Agent Chat (with ADK Agent)"
          sendFn={sendToAgentServer}
          onLocationUpdate={(loc) => mapRef.current?.showLocation(loc)}
          onClear={() => mapRef.current?.clearGraphics()}
        />
      }
    />
  );
}