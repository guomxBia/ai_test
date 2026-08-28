// src/components/ResizablePanels.test.jsx
//
// Mocked-hook tests only. This file verifies that ResizablePanels correctly
// renders and wires whatever the hook returns — it does NOT exercise the
// real hook's drag/keyboard/clamp behavior (that's covered by
// ./hooks/useResizablePanels.test.jsx and ./utils/resizable.test.js).
//
// A separate integration test (real hook, no mocking) lives in
// ResizablePanels.integration.test.jsx to avoid mixing vi.mock/vi.unmock
// in the same file, which Vitest hoists in a way that can unmock the
// module for the entire file before any test runs.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import ResizablePanels from "./ResizablePanels";
import { useResizablePanels } from "./hooks/useResizablePanels";

vi.mock("./hooks/useResizablePanels", () => ({
  useResizablePanels: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function mockHookReturn(overrides = {}) {
  const defaultReturn = {
    rootRef: { current: null },
    chatWidth: 400,
    startDrag: vi.fn(),
    onKeyDown: vi.fn(),
  };
  const value = { ...defaultReturn, ...overrides };
  useResizablePanels.mockReturnValue(value);
  return value;
}

describe("ResizablePanels (rendering & wiring, hook mocked)", () => {
  it("renders the left and right content in their respective slots", () => {
    mockHookReturn();
    render(<ResizablePanels left={<div>Map content</div>} right={<div>Chat content</div>} />);

    expect(screen.getByText("Map content")).toBeInTheDocument();
    expect(screen.getByText("Chat content")).toBeInTheDocument();
  });

  it("applies chatWidth from the hook as the chat panel's inline width", () => {
    mockHookReturn({ chatWidth: 350 });
    render(<ResizablePanels left="left" right="right" />);

    const chatPanel = document.getElementById("chatPanel");
    expect(chatPanel).toHaveStyle({ width: "350px" });
  });

  it("falls back to 40% width when chatWidth is null", () => {
    mockHookReturn({ chatWidth: null });
    render(<ResizablePanels left="left" right="right" />);

    const chatPanel = document.getElementById("chatPanel");
    expect(chatPanel).toHaveStyle({ width: "40%" });
  });

  it("wires startDrag to the resizer's onMouseDown and onTouchStart", () => {
    const { startDrag } = mockHookReturn();
    render(<ResizablePanels left="left" right="right" />);

    const resizer = screen.getByRole("separator", { name: "Resize panels" });

    fireEvent.mouseDown(resizer);
    expect(startDrag).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(resizer);
    expect(startDrag).toHaveBeenCalledTimes(2);
  });

  it("wires onKeyDown to the resizer", () => {
    const { onKeyDown } = mockHookReturn();
    render(<ResizablePanels left="left" right="right" />);

    const resizer = screen.getByRole("separator", { name: "Resize panels" });
    fireEvent.keyDown(resizer, { key: "ArrowLeft" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("exposes the resizer with the expected accessibility attributes", () => {
    mockHookReturn();
    render(<ResizablePanels left="left" right="right" />);

    const resizer = screen.getByRole("separator", { name: "Resize panels" });
    expect(resizer).toHaveAttribute("aria-orientation", "vertical");
    expect(resizer).toHaveAttribute("tabIndex", "0");
  });

  it("attaches the root ref returned by the hook to the outer container", () => {
    const rootRefObj = { current: null };
    mockHookReturn({ rootRef: rootRefObj });
    render(<ResizablePanels left="left" right="right" />);

    // The ref should now point at the actual #appRoot DOM node.
    expect(rootRefObj.current).toBe(document.getElementById("appRoot"));
  });
});