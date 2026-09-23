import { Command } from "@/components/ui/command";
import { MotionProvider } from "@/components/motion-provider";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import { expect, it } from "vitest";

const items = [
  { value: "new", label: "创建草稿", group: "草稿" },
  { value: "copy", label: "复制草稿", group: "草稿" },
  { value: "theme", label: "切换主题", group: "视图" },
];

function highlight() {
  return document.querySelector<HTMLElement>('[data-slot="command-highlight"]');
}

function opacityOf(element: HTMLElement | null) {
  return element ? getComputedStyle(element).opacity : null;
}

function expectCovering(option: HTMLElement) {
  const a = highlight()!.getBoundingClientRect();
  const b = option.getBoundingClientRect();
  expect(Math.abs(a.top - b.top)).toBeLessThan(1);
  expect(Math.abs(a.height - b.height)).toBeLessThan(1);
}

it("slides the highlight block to the pointer and keyboard target", async () => {
  render(
    <MotionProvider>
      <Command items={items} onSelect={() => undefined} />
    </MotionProvider>,
  );
  // Nothing is highlighted until the user moves or types.
  expect(highlight()).toBeNull();

  const theme = screen.getByRole("option", { name: "切换主题" });
  await userEvent.hover(theme);
  await waitFor(() => expectCovering(theme), { timeout: 3000 });

  // Moving onto a group heading leaves the block on the last item.
  await userEvent.hover(screen.getByText("视图"));
  await waitFor(() => expect(theme).not.toHaveAttribute("data-highlighted"));
  expectCovering(theme);
  expect(opacityOf(highlight())).toBe("1");

  const highlightedOption = () =>
    document.querySelector<HTMLElement>('[role="option"][data-highlighted]');
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.keyboard("{ArrowUp}");
  await waitFor(() => expect(highlightedOption()).not.toBeNull());
  const before = highlightedOption()!;
  await userEvent.keyboard("{ArrowUp}");
  await waitFor(() => expect(highlightedOption()).not.toBe(before));
  const after = highlightedOption()!;
  await waitFor(() => expectCovering(after), { timeout: 3000 });

  // Only an empty result list hides the block.
  await userEvent.keyboard("zzz");
  // Polled by hand: a testing-library `waitFor` around `toHaveStyle` locks
  // the page while Motion is still tweening the opacity.
  for (let i = 0; i < 40 && opacityOf(highlight()) !== "0"; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  expect(opacityOf(highlight())).toBe("0");
});
