// src/components/ResizablePanels.jsx
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_MAP_WIDTH = 200;
const MIN_CHAT_WIDTH = 260;
const RESIZER_WIDTH = 6;

export default function ResizablePanels({ left, right }) {
  const rootRef = useRef(null);
  const draggingRef = useRef(false);
  const [chatWidth, setChatWidth] = useState(null);

  const clampWidth = useCallback((px) => {
    const root = rootRef.current;
    if (!root) return px;
    const rootWidth = root.getBoundingClientRect().width;
    const maxChatWidth = rootWidth - RESIZER_WIDTH - MIN_MAP_WIDTH;
    return Math.max(MIN_CHAT_WIDTH, Math.min(px, Math.max(MIN_CHAT_WIDTH, maxChatWidth)));
  }, []);

  useEffect(() => {
    function initWidth() {
      const root = rootRef.current;
      if (root) setChatWidth(clampWidth(root.getBoundingClientRect().width * 0.4));
    }
    initWidth();
    window.addEventListener("resize", initWidth);
    return () => window.removeEventListener("resize", initWidth);
  }, [clampWidth]);

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current || !rootRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rootRect = rootRef.current.getBoundingClientRect();
      setChatWidth(clampWidth(rootRect.right - clientX - RESIZER_WIDTH));
    }
    function onUp() {
      draggingRef.current = false;
      document.body.classList.remove("resizing");
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [clampWidth]);

  function startDrag() {
    draggingRef.current = true;
    document.body.classList.add("resizing");
  }

  function onKeyDown(e) {
    const step = 20;
    if (e.key === "ArrowLeft") {
      setChatWidth((w) => clampWidth((w ?? 0) + step));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setChatWidth((w) => clampWidth((w ?? 0) - step));
      e.preventDefault();
    }
  }

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