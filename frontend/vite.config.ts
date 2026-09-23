import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Ship pdfjs cmaps, standard fonts and wasm decoders so the in-browser preview
// can render CJK / CID-keyed fonts. Without them, Chinese glyphs render blank.
const pdfjsDir = path.dirname(
  createRequire(import.meta.url).resolve("pdfjs-dist/package.json"),
);
const pdfjsAssets = ["cmaps", "standard_fonts", "wasm"].map((dir) => ({
  src: normalizePath(path.join(pdfjsDir, dir, "*")),
  dest: `pdfjs/${dir}`,
  rename: { stripBase: true as const },
}));

// Match the real package directory, not pnpm's `.pnpm/<name>@version` segment.
const packageDir = (names: string) =>
  new RegExp(`node_modules[\\\\/](?:${names})[\\\\/]`);

// LazyMotion loads these through import("@/lib/motion-features"), not the shell.
const motionFeature =
  /[\\/](?:features(?:[\\/-]|$)|feature-bundle|features-animation|features-max|features-min)/;

const motionRuntime = packageDir(
  "motion-dom|motion-utils|framer-motion|motion",
);

export default defineConfig({
  // Absolute base: the backend serves index.html for every non-API path, so
  // nested routes such as /jobs/:id must still resolve /assets/*.
  base: "/",
  plugins: [tailwindcss(), react(), viteStaticCopy({ targets: pdfjsAssets })],
  server: {
    proxy: { "/api": "http://localhost:8080" },
  },
  // Largest chunk is the lazily loaded pdf-preview (pdf.js, ~635 kB), only
  // fetched for finished jobs. 635 * 1.2 = 762, rounded up to 800 kB.
  // Base UI is not grouped: only the shell's subset belongs on the first load.
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: packageDir("react|react-dom|scheduler"),
            },
            {
              name: "router",
              test: /node_modules[\\/]@tanstack[\\/](router-core|react-router|history)[\\/]/,
            },
            {
              name: "motion",
              // $initial: only modules the shell reaches statically. The test
              // also skips feature bundles so domAnimation stays in the
              // dynamic motion-features chunk.
              tags: ["$initial"],
              test: (id) => motionRuntime.test(id) && !motionFeature.test(id),
            },
          ],
        },
      },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
