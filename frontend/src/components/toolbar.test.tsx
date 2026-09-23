import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessible } from "@/test/a11y";
import { FilterSelect, SearchField, Toolbar } from "./toolbar";

function Harness() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  return (
    <Toolbar
      search={
        <SearchField
          aria-label="搜索"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
        />
      }
      actions={<button type="button">重置</button>}
    >
      <FilterSelect
        label="状态"
        value={status}
        onChange={setStatus}
        allLabel="全部状态"
        options={[
          { value: "open", label: "进行中" },
          { value: "done", label: "已完成" },
        ]}
      />
      <output>{status || "none"}</output>
    </Toolbar>
  );
}

describe("toolbar primitives", () => {
  it("shows the clear button only with a value and clears through it", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const input = screen.getByRole("searchbox", { name: "搜索" });
    expect(screen.queryByRole("button", { name: "清除搜索" })).toBeNull();
    await user.type(input, "abc");
    expect(input).toHaveValue("abc");
    await user.click(screen.getByRole("button", { name: "清除搜索" }));
    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "清除搜索" })).toBeNull();
    await expectAccessible(container);
  });

  it("maps the empty option back to an empty string", async () => {
    render(<Harness />);
    const trigger = screen.getByRole("combobox", { name: "状态" });
    expect(trigger).toHaveTextContent("全部状态");
    fireEvent.click(trigger);
    const done = await screen.findByRole("option", { name: "已完成" });
    fireEvent.pointerDown(done);
    fireEvent.click(done);
    expect(screen.getByRole("status")).toHaveTextContent("done");
    fireEvent.click(trigger);
    const all = await screen.findByRole("option", { name: "全部状态" });
    fireEvent.pointerDown(all);
    fireEvent.click(all);
    expect(screen.getByRole("status")).toHaveTextContent("none");
  });

  it("renders without a search slot as a single wrapping row", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Toolbar>
        <FilterSelect label="范围" value="" onChange={onChange} options={[]} />
      </Toolbar>,
    );
    expect(container.firstElementChild?.className).not.toContain("grid-cols");
  });
});
