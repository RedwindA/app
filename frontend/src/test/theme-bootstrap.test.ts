import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const html = readFileSync("index.html", "utf8");
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
describe("theme before React mounts", () => {
  it.each([
    ["light", true, false],
    ["dark", false, true],
    ["system", false, false],
    ["system", true, true],
    [null, false, true],
    ["invalid", false, true],
  ])(
    "resolves stored %s and system dark=%s",
    (stored, systemDark, expectedDark) => {
      document.documentElement.classList.add("dark");
      const meta = { content: "" };
      const root = document.documentElement;
      runInNewContext(bootstrap!, {
        localStorage: { getItem: () => stored },
        matchMedia: () => ({ matches: systemDark }),
        document: { documentElement: root, querySelector: () => meta },
      });
      expect(root.classList.contains("dark")).toBe(expectedDark);
      expect(root.style.colorScheme).toBe(expectedDark ? "dark" : "light");
      expect(meta.content).toBe(expectedDark ? "#0d0d0f" : "#f7f5f0");
    },
  );
  it("defaults safely when storage is blocked", () => {
    runInNewContext(bootstrap!, {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
      document: {
        documentElement: document.documentElement,
        querySelector: () => ({ content: "" }),
      },
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
