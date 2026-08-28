// src/components/ResizablePanels.jsx
import { useResizablePanels } from "./hooks/useResizablePanels";

export default function ResizablePanels({ left, right }) {
  const { rootRef, chatWidth, startDrag, onKeyDown } = useResizablePanels();

  return (
    <div id="appRoot" ref={rootRef}>
      <div className="map-slot">{left}</div>

      <div
        id="resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        tabIndex={0}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onKeyDown={onKeyDown}
      />

      <div id="chatPanel" style={{ width: chatWidth ? `${chatWidth}px` : "40%" }}>
        {right}
      </div>
    </div>
  );
}