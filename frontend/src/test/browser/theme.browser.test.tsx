import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { act, render, screen, waitFor } from "@testing-library/react";
import { cdp } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";

type CdpSession = {
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
};

function ThemeHarness() {
  return (
    <ThemeProvider>
      <MotionProvider>
        <p>侧栏导航</p>
        <ThemeToggle />
      </MotionProvider>
    </ThemeProvider>
  );
}

function prepareDarkTheme() {
  localStorage.setItem("latex-app-theme", "dark");
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove(
    "theme-transition",
    "theme-view-transition",
  );
  document.documentElement.style.colorScheme = "dark";
}

let restoreViewTransition: (() => void) | undefined;

function trackViewTransitions() {
  const native = document.startViewTransition.bind(document);
  let calls = 0;
  document.startViewTransition = (callback) => {
    calls += 1;
    return native(callback);
  };
  restoreViewTransition = () => {
    document.startViewTransition = native;
  };
  return () => calls;
}

function durationMs(value: string) {
  const first = value.split(",")[0]?.trim() ?? "";
  if (first.endsWith("ms")) return Number.parseFloat(first);
  if (first.endsWith("s")) return Number.parseFloat(first) * 1000;
  return Number.NaN;
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function setReducedMotion(reduce: boolean) {
  const session = cdp() as unknown as CdpSession;
  await session.send("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-reduced-motion",
        value: reduce ? "reduce" : "no-preference",
      },
    ],
  });
}

describe("theme switch in a real browser", () => {
  afterEach(() => {
    restoreViewTransition?.();
    restoreViewTransition = undefined;
    document.documentElement.classList.remove(
      "dark",
      "theme-transition",
      "theme-view-transition",
    );
    document.documentElement.style.colorScheme = "";
    localStorage.removeItem("latex-app-theme");
  });

  it("cross-fades with View Transitions and releases the selection lock", async () => {
    prepareDarkTheme();
    expect(typeof document.startViewTransition).toBe("function");
    expect(String(document.startViewTransition)).toContain("[native code]");
    const calls = trackViewTransitions();
    render(<ThemeHarness />);
    const root = document.documentElement;
    expect(calls()).toBe(0);
    expect(root.classList.contains("dark")).toBe(true);
    expect(getComputedStyle(root).colorScheme).toBe("dark");

    act(() => {
      screen.getByRole("button").click();
    });
    // The class is added synchronously; Chromium runs the update callback later.
    expect(calls()).toBe(1);
    expect(root.classList.contains("theme-view-transition")).toBe(true);
    expect(root.classList.contains("theme-transition")).toBe(false);
    // Hit-testing lands on <html> during the root snapshot, so selection is off
    // only while that class is present.
    expect(getComputedStyle(root).userSelect).toBe("none");

    await waitFor(() => {
      expect(root.classList.contains("dark")).toBe(false);
      expect(root.classList.contains("theme-view-transition")).toBe(true);
    });
    expect(getComputedStyle(root).colorScheme).toBe("light");
    await nextFrame();
    const oldSnapshot = getComputedStyle(root, "::view-transition-old(root)");
    const newSnapshot = getComputedStyle(root, "::view-transition-new(root)");
    expect(oldSnapshot.mixBlendMode).toBe("plus-lighter");
    expect(newSnapshot.mixBlendMode).toBe("plus-lighter");
    expect(durationMs(oldSnapshot.animationDuration)).toBeCloseTo(200, 0);
    expect(durationMs(newSnapshot.animationDuration)).toBeCloseTo(200, 0);

    act(() => {
      screen.getByRole("button").click();
    });
    // A second toggle during the fade reuses the in-flight transition.
    expect(calls()).toBe(1);
    expect(root.classList.contains("dark")).toBe(true);
    expect(getComputedStyle(root).colorScheme).toBe("dark");
    expect(root.classList.contains("theme-view-transition")).toBe(true);

    await waitFor(
      () => {
        expect(root.classList.contains("theme-view-transition")).toBe(false);
      },
      { timeout: 2000 },
    );
    expect(root.classList.contains("theme-transition")).toBe(false);
    expect(getComputedStyle(root).userSelect).toBe("auto");
    expect(root.classList.contains("dark")).toBe(true);
    expect(getComputedStyle(root).colorScheme).toBe("dark");
  });

  it("skips the View Transition when reduced motion is requested", async () => {
    await setReducedMotion(true);
    try {
      expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
      // 0.01ms is the reduced-motion duration in index.css. Chrome reports it
      // as 1e-05s.
      expect(
        durationMs(getComputedStyle(document.body).animationDuration),
      ).toBeCloseTo(0.01, 3);
      prepareDarkTheme();
      const calls = trackViewTransitions();
      render(<ThemeHarness />);
      act(() => {
        screen.getByRole("button").click();
      });
      const root = document.documentElement;
      expect(calls()).toBe(0);
      expect(root.classList.contains("dark")).toBe(false);
      expect(getComputedStyle(root).colorScheme).toBe("light");
      expect(root.classList.contains("theme-view-transition")).toBe(false);
      expect(root.classList.contains("theme-transition")).toBe(false);
    } finally {
      await setReducedMotion(false);
    }
  });
});
