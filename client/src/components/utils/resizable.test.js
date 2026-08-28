// src/utils/resizable.test.js
import { describe, it, expect } from "vitest";
import {
  clampWidth,
  getClientXFromEvent,
  computeChatWidthFromPointer,
  MIN_CHAT_WIDTH,
  MIN_MAP_WIDTH,
  RESIZER_WIDTH,
} from "./resizable";

describe("clampWidth", () => {
  it("returns the raw value when rootWidth is not a number", () => {
    expect(clampWidth(300, undefined)).toBe(300);
    expect(clampWidth(300, NaN)).toBe(300);
  });

  it("clamps to MIN_CHAT_WIDTH when px is too small", () => {
    expect(clampWidth(50, 1000)).toBe(MIN_CHAT_WIDTH);
  });

  it("clamps to the max chat width when px is too large", () => {
    const rootWidth = 1000;
    const expectedMax = rootWidth - RESIZER_WIDTH - MIN_MAP_WIDTH; // 794
    expect(clampWidth(2000, rootWidth)).toBe(expectedMax);
  });

  it("returns px unchanged when it's within bounds", () => {
    expect(clampWidth(400, 1000)).toBe(400);
  });

  it("falls back to MIN_CHAT_WIDTH if the root is too narrow to fit both minimums", () => {
    // rootWidth smaller than minMapWidth + resizerWidth + minChatWidth
    const rootWidth = 300;
    expect(clampWidth(1000, rootWidth)).toBe(MIN_CHAT_WIDTH);
  });

  it("respects custom overrides", () => {
    expect(
      clampWidth(50, 1000, { minChatWidth: 100, minMapWidth: 100, resizerWidth: 10 })
    ).toBe(100);
  });
});

describe("getClientXFromEvent", () => {
  it("reads clientX directly from a mouse-like event", () => {
    expect(getClientXFromEvent({ clientX: 123 })).toBe(123);
  });

  it("reads clientX from the first touch point", () => {
    expect(getClientXFromEvent({ touches: [{ clientX: 55 }] })).toBe(55);
  });

  it("prefers touches over clientX when both exist", () => {
    expect(getClientXFromEvent({ clientX: 999, touches: [{ clientX: 55 }] })).toBe(55);
  });
});

describe("computeChatWidthFromPointer", () => {
  it("computes width as distance from pointer to root's right edge, minus resizer width", () => {
    const rootRect = { right: 1000 };
    expect(computeChatWidthFromPointer(700, rootRect)).toBe(1000 - 700 - RESIZER_WIDTH);
  });

  it("supports a custom resizer width", () => {
    const rootRect = { right: 1000 };
    expect(computeChatWidthFromPointer(700, rootRect, 10)).toBe(1000 - 700 - 10);
  });
});