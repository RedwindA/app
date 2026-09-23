import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": src } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/.git/**", "**/*.browser.test.*"],
        },
      },
      {
        extends: true,
        plugins: [tailwindcss()],
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}"],
          setupFiles: ["./src/test/browser/setup.ts"],
          // Vitest strips CSS unless this is on, which would make contrast and
          // layout assertions meaningless.
          css: true,
          testTimeout: 15000,
          browser: {
            enabled: true,
            headless: true,
            // Keep failure output in the reporter instead of image files.
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
