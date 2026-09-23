import axe from "axe-core";
import { expect } from "vitest";

export async function expectAccessible(element: Element) {
  const result = await axe.run(element, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    // jsdom has no layout or canvas; check contrast in a real browser.
    rules: { "color-contrast": { enabled: false } },
  });
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}
