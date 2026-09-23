import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { Command } from "./command";

it("lists ungrouped commands before any group heading", () => {
  render(
    <Command
      onSelect={() => {}}
      items={[
        { value: "rename", label: "重命名", group: "编辑" },
        { value: "help", label: "帮助" },
        { value: "copy", label: "复制", group: "编辑" },
      ]}
    />,
  );
  const options = screen.getAllByRole("option").map((o) => o.textContent);
  expect(options).toEqual(["帮助", "重命名", "复制"]);
  const group = screen.getByRole("group", { name: "编辑" });
  expect(
    within(group).queryByRole("option", { name: "帮助" }),
  ).not.toBeInTheDocument();
});
