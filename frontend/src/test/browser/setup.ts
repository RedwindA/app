import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@/styles/index.css";

// Real styles only. src/test/setup.ts stubs browser APIs for jsdom and must
// stay off this project.
afterEach(() => {
  cleanup();
});
