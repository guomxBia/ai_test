// src/hooks/useResizablePanels.js
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampWidth,
  getClientXFromEvent,
  computeChatWidthFromPointer,
  ARROW_KEY_STEP,
} from "../utils/resizable";

/**
 * Encapsulates all drag/keyboard/resize logic for a two-panel
 * (map + chat) resizable layout.
 *
 * @param {Object} options
 * @param {number} [options.initialRatio=0.4] - initial chat width as a fraction of root width
 * @param {number} [options.step=ARROW_KEY_STEP] - px change per arrow key press
 */
export function useResizablePanels({ initialRatio = 0.4, step = ARROW_KEY_STEP } = {}) {
  const rootRef = useRef(null);
  const draggingRef = useRef(false);
  const [chatWidth, setChatWidth] = useState(null);

  const clamp = useCallback((px) => {
    const root = rootRef.current;
    if (!root) return px;
    const rootWidth = root.getBoundingClientRect().width;
    return clampWidth(px, rootWidth);
  }, []);

  // Set/refresh initial width on mount and on window resize.
  useEffect(() => {
    function initWidth() {
      const root = rootRef.current;
      if (root) {
        setChatWidth(clamp(root.getBoundingClientRect().width * initialRatio));
      }
    }
    initWidth();
    window.addEventListener("resize", initWidth);
    return () => window.removeEventListener("resize", initWidth);
  }, [clamp, initialRatio]);

  // Global drag listeners (mouse + touch).
  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current || !rootRef.current) return;
      const clientX = getClientXFromEvent(e);
      const rootRect = rootRef.current.getBoundingClientRect();
      setChatWidth(clamp(computeChatWidthFromPointer(clientX, rootRect)));
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
  }, [clamp]);

  const startDrag = useCallback(() => {
    draggingRef.current = true;
    document.body.classList.add("resizing");
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") {
        setChatWidth((w) => clamp((w ?? 0) + step));
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setChatWidth((w) => clamp((w ?? 0) - step));
        e.preventDefault();
      }
    },
    [clamp, step]
  );

  return { rootRef, chatWidth, startDrag, onKeyDown };
}