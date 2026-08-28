// src/hooks/useResizablePanels.test.jsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup, screen } from "@testing-library/react";
import { useResizablePanels } from "./useResizablePanels";

// Small harness so the hook has a real DOM node to measure.
function Harness(props) {
  const { rootRef, chatWidth, startDrag, onKeyDown } = useResizablePanels(props);
  return (
    <div ref={rootRef} data-testid="root">
      <div
        data-testid="resizer"
        tabIndex={0}
        onMouseDown={startDrag}
        onKeyDown={onKeyDown}
      />
      <div data-testid="chat" style={{ width: chatWidth ?? undefined }}>
        {chatWidth}
      </div>
    </div>
  );
}

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.classList.remove("resizing");
});

describe("useResizablePanels", () => {
  it("computes an initial width based on the default ratio (0.4) and clamps it", () => {
    render(<Harness />);
    const root = screen.getByTestId("root");
    mockRootRect(root); // width: 1000, right: 1000

    // Trigger the effect's resize handler manually since rect is mocked after mount.
    fireEvent(window, new Event("resize"));

    expect(screen.getByTestId("chat").textContent).toBe("400"); // 1000 * 0.4
  });

  it("respects a custom initialRatio", () => {
    render(<Harness initialRatio={0.5} />);
    const root = screen.getByTestId("root");
    mockRootRect(root);

    fireEvent(window, new Event("resize"));

    expect(screen.getByTestId("chat").textContent).toBe("500");
  });

  it("increases width on ArrowLeft and decreases on ArrowRight by `step`", () => {
    render(<Harness step={20} />);
    const root = screen.getByTestId("root");
    mockRootRect(root);
    fireEvent(window, new Event("resize")); // establishes width = 400

    const resizer = screen.getByTestId("resizer");

    fireEvent.keyDown(resizer, { key: "ArrowLeft" });
    expect(screen.getByTestId("chat").textContent).toBe("420");

    fireEvent.keyDown(resizer, { key: "ArrowRight" });
    fireEvent.keyDown(resizer, { key: "ArrowRight" });
    expect(screen.getByTestId("chat").textContent).toBe("380");
  });

  it("updates width while dragging via mousedown -> mousemove -> mouseup", () => {
    render(<Harness />);
    const root = screen.getByTestId("root");
    mockRootRect(root); // width: 1000, right: 1000
    fireEvent(window, new Event("resize"));

    const resizer = screen.getByTestId("resizer");

    fireEvent.mouseDown(resizer);
    expect(document.body.classList.contains("resizing")).toBe(true);

    fireEvent(window, new MouseEvent("mousemove", { clientX: 700 }));
    // rootRect.right(1000) - clientX(700) - RESIZER_WIDTH(6) = 294
    expect(screen.getByTestId("chat").textContent).toBe("294");

    fireEvent(window, new MouseEvent("mouseup"));
    expect(document.body.classList.contains("resizing")).toBe(false);

    // Further mousemove after mouseup should have no effect.
    fireEvent(window, new MouseEvent("mousemove", { clientX: 100 }));
    expect(screen.getByTestId("chat").textContent).toBe("294");
  });

  it("ignores mousemove before any drag has started", () => {
    render(<Harness />);
    const root = screen.getByTestId("root");
    mockRootRect(root);
    fireEvent(window, new Event("resize"));

    fireEvent(window, new MouseEvent("mousemove", { clientX: 100 }));
    expect(screen.getByTestId("chat").textContent).toBe("400");
  });

  it("cleans up window listeners on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<Harness />);
    unmount();

    const addedEvents = addSpy.mock.calls.map(([type]) => type);
    const removedEvents = removeSpy.mock.calls.map(([type]) => type);

    for (const type of ["resize", "mousemove", "mouseup", "touchmove", "touchend"]) {
      expect(addedEvents).toContain(type);
      expect(removedEvents).toContain(type);
    }
  });
});