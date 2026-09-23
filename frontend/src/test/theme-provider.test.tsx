import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function Probe() {
  const { setTheme } = useTheme();
  return (
    <div>
      <button type="button" onClick={() => setTheme("light")}>
        set-light
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        set-dark
      </button>
    </div>
  );
}

function viewTransitionStub(
  callbackOptions?: ViewTransitionUpdateCallback | StartViewTransitionOptions,
  finished: Promise<void> = Promise.resolve(),
): ViewTransition {
  if (typeof callbackOptions === "function") {
    void callbackOptions();
  }
  const done = Promise.resolve();
  return {
    finished,
    ready: done,
    updateCallbackDone: done,
    types: new Set<string>() as ViewTransitionTypeSet,
    skipTransition() {},
  };
}

function matchMediaStub(matchesFor: (query: string) => boolean) {
  return (query: string) =>
    ({
      matches: matchesFor(query),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

describe("ThemeProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem("latex-app-theme");
    document.documentElement.classList.remove(
      "theme-transition",
      "theme-view-transition",
    );
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "";
    Reflect.deleteProperty(document, "startViewTransition");
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "#0d0d0f");
    window.matchMedia = matchMediaStub(() => false);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.documentElement.classList.remove(
      "dark",
      "theme-transition",
      "theme-view-transition",
    );
    document.documentElement.style.colorScheme = "";
    localStorage.removeItem("latex-app-theme");
    document.querySelector('meta[name="theme-color"]')?.remove();
    Reflect.deleteProperty(document, "startViewTransition");
    window.matchMedia = originalMatchMedia;
  });

  it("applies the stored theme on mount without a transition class", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.style.colorScheme).toBe("dark");
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#0d0d0f");
    expect(root.classList.contains("theme-transition")).toBe(false);
  });

  it("fades with a temporary class when View Transitions are unavailable", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.classList.contains("theme-transition")).toBe(true);
    expect(localStorage.getItem("latex-app-theme")).toBe("light");
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(root.classList.contains("theme-transition")).toBe(false);
  });

  it("uses startViewTransition on toggle but not on mount", () => {
    const start = vi.fn(viewTransitionStub);
    document.startViewTransition = start;
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(start).not.toHaveBeenCalled();
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(false);
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(start).toHaveBeenCalledTimes(1);
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies instantly when reduced motion is requested", () => {
    const start = vi.fn(viewTransitionStub);
    document.startViewTransition = start;
    window.matchMedia = matchMediaStub(
      (query) => query === "(prefers-reduced-motion: reduce)",
    );
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(start).not.toHaveBeenCalled();
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("keeps the fallback class until 250ms after the last rapid toggle", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(true);
    act(() => {
      screen.getByRole("button", { name: "set-dark" }).click();
    });
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(true);
    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(false);
  });

  it("does not animate on StrictMode mount, then transitions on the first toggle", () => {
    const start = vi.fn(viewTransitionStub);
    document.startViewTransition = start;
    render(
      <StrictMode>
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      </StrictMode>,
    );
    expect(start).not.toHaveBeenCalled();
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(false);
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("applies directly while a View Transition is still in flight", async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const start = vi.fn((cb?: ViewTransitionUpdateCallback) =>
      viewTransitionStub(cb, finished),
    );
    document.startViewTransition = start;
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(start).toHaveBeenCalledTimes(1);
    act(() => {
      screen.getByRole("button", { name: "set-dark" }).click();
    });
    // No second transition, but the DOM still reaches the new theme.
    expect(start).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(
      document.documentElement.classList.contains("theme-transition"),
    ).toBe(false);
    await act(async () => {
      finish();
      await finished;
    });
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(start).toHaveBeenCalledTimes(2);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("blocks text selection only while the View Transition is in flight", async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    document.startViewTransition = vi.fn((cb?: ViewTransitionUpdateCallback) =>
      viewTransitionStub(cb, finished),
    );
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    const root = document.documentElement;
    expect(root.classList.contains("theme-view-transition")).toBe(false);
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    expect(root.classList.contains("theme-view-transition")).toBe(true);
    // A mid-flight toggle keeps the marker; the fade is still covering the page.
    act(() => {
      screen.getByRole("button", { name: "set-dark" }).click();
    });
    expect(root.classList.contains("theme-view-transition")).toBe(true);
    await act(async () => {
      finish();
      await finished;
    });
    expect(root.classList.contains("theme-view-transition")).toBe(false);
  });

  it("clears the View Transition marker when a skipped transition rejects", async () => {
    const finished = Promise.reject(new Error("skipped"));
    finished.catch(() => {});
    document.startViewTransition = vi.fn((cb?: ViewTransitionUpdateCallback) =>
      viewTransitionStub(cb, finished),
    );
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByRole("button", { name: "set-light" }).click();
    });
    const root = document.documentElement;
    expect(root.classList.contains("theme-view-transition")).toBe(true);
    await act(async () => {
      await finished.catch(() => {});
    });
    expect(root.classList.contains("theme-view-transition")).toBe(false);
  });
});
