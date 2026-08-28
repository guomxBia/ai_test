// src/components/ResizablePanels.integration.test.jsx
//
// Uses the REAL useResizablePanels hook (no mocking) to confirm the
// component and hook are actually wired together end-to-end. Kept
// separate from ResizablePanels.test.jsx so this file never needs
// vi.mock/vi.unmock at all.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import ResizablePanels from "./ResizablePanels";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.classList.remove("resizing");
});

function mockRootRect(el, { width = 1000, right = 1000 } = {}) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    width,
    right,
    left: right - width,
    top: 0,
    bottom: 0,
    height: 0,
    x: right - width,
    y: 0,
    toJSON() {},
  });
}

describe("ResizablePanels (integration, real hook)", () => {
  it("resizes the chat panel when the resizer receives an ArrowLeft/ArrowRight keydown", () => {
    render(<ResizablePanels left="left" right="right" />);

    const root = document.getElementById("appRoot");
    mockRootRect(root);
    fireEvent(window, new Event("resize")); // establishes initial width (~400px)

    const resizer = screen.getByRole("separator", { name: "Resize panels" });
    const chatPanel = document.getElementById("chatPanel");

    const widthBefore = chatPanel.style.width;
    fireEvent.keyDown(resizer, { key: "ArrowLeft" });
    const widthAfter = chatPanel.style.width;

    expect(widthAfter).not.toBe(widthBefore);
  });

  it("resizes the chat panel when dragging the resizer with the mouse", () => {
    render(<ResizablePanels left="left" right="right" />);

    const root = document.getElementById("appRoot");
    mockRootRect(root);
    fireEvent(window, new Event("resize"));

    const resizer = screen.getByRole("separator", { name: "Resize panels" });
    const chatPanel = document.getElementById("chatPanel");

    fireEvent.mouseDown(resizer);
    expect(document.body.classList.contains("resizing")).toBe(true);

    fireEvent(window, new MouseEvent("mousemove", { clientX: 700 }));
    // rootRect.right(1000) - clientX(700) - RESIZER_WIDTH(6) = 294
    expect(chatPanel.style.width).toBe("294px");

    fireEvent(window, new MouseEvent("mouseup"));
    expect(document.body.classList.contains("resizing")).toBe(false);
  });
});