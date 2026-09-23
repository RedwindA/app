import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { expectAccessible } from "@/test/a11y";
import { DatePicker } from "./date-picker";

beforeAll(() => vi.stubGlobal("PointerEvent", MouseEvent));
afterAll(() => vi.unstubAllGlobals());

function Fixture(props: Partial<React.ComponentProps<typeof DatePicker>>) {
  const [value, setValue] = useState("2026-09-30");
  return (
    <DatePicker
      label="截止日期"
      name="deadline"
      value={value}
      onValueChange={setValue}
      {...props}
    />
  );
}

it("selects by keyboard, restores input focus and clears the date", async () => {
  const user = userEvent.setup();
  const { container } = render(<Fixture />);
  const input = screen.getByRole("textbox", { name: "截止日期" });
  await user.tab();
  expect(input).toHaveFocus();
  await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
  const selected = await screen.findByRole("button", { name: /2026年9月30日/ });
  await waitFor(() => expect(selected).toHaveFocus());
  await expectAccessible(screen.getByRole("dialog"));
  await user.keyboard("{ArrowRight}{Enter}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(input).toHaveValue("2026-10-01");
  expect(container.querySelector('input[name="deadline"]')).toHaveValue(
    "2026-10-01",
  );
  await waitFor(() => expect(input).toHaveFocus());
  await user.click(screen.getByRole("button", { name: "打开截止日期日历" }));
  await user.click(await screen.findByRole("button", { name: "清除" }));
  expect(input).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "打开截止日期日历" }));
  await user.keyboard("{Escape}");
  await waitFor(() => expect(input).toHaveFocus());
});

it("accepts typed dates, validates leap days and bounds, and submits canonical dates", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <Fixture min="2024-01-01" max="2030-12-31" />
    </form>,
  );
  const input = screen.getByRole("textbox", { name: "截止日期" });
  await user.clear(input);
  await user.type(input, "2024/2/29{Enter}");
  expect(input).toHaveValue("2024-02-29");
  expect(new FormData(container.querySelector("form")!).get("deadline")).toBe(
    "2024-02-29",
  );
  await user.clear(input);
  await user.type(input, "2025-02-29{Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent("请输入有效日期");
  expect(input).toBeInvalid();
  await user.keyboard("{Escape}");
  expect(input).toHaveValue("2024-02-29");
  await user.clear(input);
  await user.type(input, "2031-01-01{Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "日期不能晚于 2030-12-31",
  );
  expect(input).toBeInvalid();
  await user.clear(input);
  await user.type(input, "2023-12-31");
  await user.tab();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "日期不能早于 2024-01-01",
  );
});

it("jumps directly to a different year and month and preserves navigation bounds", async () => {
  const user = userEvent.setup();
  render(<Fixture min="2024-03-10" max="2030-11-20" />);
  await user.click(screen.getByRole("button", { name: "打开截止日期日历" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "选择年份" }),
    "2030",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "选择月份" }),
    "10",
  );
  expect(screen.getByRole("grid", { name: "2030年11月" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /2030年11月21日/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: "前往下个月" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await user.click(screen.getByRole("button", { name: /2030年11月15日/ }));
  expect(screen.getByRole("textbox", { name: "截止日期" })).toHaveValue(
    "2030-11-15",
  );
});

it("binds labels and descriptions to the editable input and follows external updates", () => {
  const onValueChange = vi.fn();
  const { rerender } = render(
    <>
      <label htmlFor="deadline">截止日期</label>
      <DatePicker
        id="deadline"
        label="截止日期"
        value="2026-09-30"
        onValueChange={onValueChange}
        aria-describedby="deadline-error"
        aria-invalid
      />
      <p id="deadline-error">日期无效</p>
    </>,
  );
  const input = screen.getByRole("textbox", { name: "截止日期" });
  expect(input).toHaveAccessibleDescription("日期无效");
  expect(input).toHaveAttribute("aria-invalid", "true");
  rerender(
    <DatePicker
      label="截止日期"
      value="2028-06-15"
      onValueChange={onValueChange}
    />,
  );
  expect(screen.getByRole("textbox", { name: "截止日期" })).toHaveValue(
    "2028-06-15",
  );
});

it("enforces required, disabled and read-only states", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Fixture required />);
  await user.click(screen.getByRole("button", { name: "打开截止日期日历" }));
  expect(screen.getByRole("button", { name: "清除" })).toBeDisabled();
  await user.keyboard("{Escape}");
  const input = screen.getByRole("textbox", { name: "截止日期" });
  await user.clear(input);
  await user.tab();
  expect(input).toBeInvalid();
  expect(screen.getByRole("alert")).toHaveTextContent("请选择或输入日期");
  rerender(<Fixture readOnly />);
  expect(input).toHaveAttribute("readonly");
  expect(
    screen.getByRole("button", { name: "打开截止日期日历" }),
  ).toBeDisabled();
  rerender(<Fixture disabled />);
  expect(input).toBeDisabled();
});
