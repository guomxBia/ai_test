// src/utils/resizable.js

export const MIN_MAP_WIDTH = 200;
export const MIN_CHAT_WIDTH = 260;
export const RESIZER_WIDTH = 6;
export const ARROW_KEY_STEP = 20;

/**
 * Clamp a candidate chat-panel width to stay within the map's minimum
 * width and the chat's own minimum width, given the total root width.
 */
export function clampWidth(
  px,
  rootWidth,
  {
    minChatWidth = MIN_CHAT_WIDTH,
    minMapWidth = MIN_MAP_WIDTH,
    resizerWidth = RESIZER_WIDTH,
  } = {}
) {
  if (typeof rootWidth !== "number" || Number.isNaN(rootWidth)) {
    return px;
  }
  const maxChatWidth = rootWidth - resizerWidth - minMapWidth;
  return Math.max(minChatWidth, Math.min(px, Math.max(minChatWidth, maxChatWidth)));
}

/** Normalize clientX across mouse and touch events. */
export function getClientXFromEvent(e) {
  if (e.touches && e.touches.length > 0) {
    return e.touches[0].clientX;
  }
  return e.clientX;
}

/** Given a pointer x-position and the root's bounding rect, compute the raw chat width. */
export function computeChatWidthFromPointer(clientX, rootRect, resizerWidth = RESIZER_WIDTH) {
  return rootRect.right - clientX - resizerWidth;
}