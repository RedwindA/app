import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { expectAccessible } from "@/test/a11y";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Combobox } from "./combobox";

describe("keyboard access to overlay controls", () => {
  beforeAll(() => vi.stubGlobal("PointerEvent", MouseEvent));
  afterAll(() => vi.unstubAllGlobals());

  it("names and describes the dialog, traps focus and restores it on Escape", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dialog>
          <DialogTrigger>打开测试弹窗</DialogTrigger>
          <DialogContent>
            <DialogTitle>项目设置</DialogTitle>
            <DialogDescription>修改当前项目</DialogDescription>
            <button>保存</button>
          </DialogContent>
        </Dialog>
        <button>外部按钮</button>
      </>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "项目设置" });
    expect(dialog).toHaveAccessibleDescription("修改当前项目");
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
    for (let index = 0; index < 4; index++) {
      await user.tab();
      await waitFor(() =>
        expect(dialog.contains(document.activeElement)).toBe(true),
      );
    }
    await expectAccessible(dialog);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "打开测试弹窗" }),
      ).toHaveFocus(),
    );
  });

  it("selects by keyboard, skips disabled options and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Select
        defaultValue="a"
        items={{ a: "待开始", b: "不可选", c: "进行中" }}
      >
        <SelectTrigger aria-label="项目状态">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">待开始</SelectItem>
          <SelectItem value="b" disabled>
            不可选
          </SelectItem>
          <SelectItem value="c">进行中</SelectItem>
        </SelectContent>
      </Select>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    const list = await screen.findByRole("listbox");
    await expectAccessible(list);
    await user.keyboard("{End}{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "项目状态" }),
      ).toHaveTextContent("进行中"),
    );
    await user.keyboard("{Enter}{Home}{ArrowDown}{Enter}");
    expect(
      screen.getByRole("combobox", { name: "项目状态" }),
    ).toHaveTextContent("进行中");
    await user.keyboard("{Enter}{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("combobox", { name: "项目状态" })).toHaveFocus();
  });

  it("filters a named combobox, selects with Enter and clears the value", async () => {
    const user = userEvent.setup();
    function Fixture() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <Combobox
          label="负责人"
          options={[
            { value: "a", label: "Alice" },
            { value: "b", label: "Bob" },
          ]}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    const { container } = render(<Fixture />);
    const input = screen.getByRole("combobox", { name: "负责人" });
    await user.tab();
    await user.type(input, "Bob");
    expect(
      await screen.findByRole("option", { name: "Bob" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Alice" }),
    ).not.toBeInTheDocument();
    await expectAccessible(document.body);
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(input).toHaveValue("Bob"));
    await user.click(screen.getByRole("button", { name: "清除负责人" }));
    expect(input).toHaveValue("");
    await user.type(input, "unknown");
    expect(await screen.findByText("没有匹配的选项")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    await expectAccessible(container);
  });
});
