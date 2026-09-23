import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { expectAccessible } from "@/test/a11y";
import { RangeSlider } from "./slider";

it("moves a named range slider with the keyboard", async () => {
  const user = userEvent.setup();
  function Fixture() {
    const [value, setValue] = useState<readonly number[]>([20, 80]);
    return (
      <div>
        <RangeSlider
          startLabel="计划起点"
          endLabel="计划终点"
          value={value}
          onValueChange={setValue}
        />
        <output>
          {value[0]}-{value[1]}
        </output>
      </div>
    );
  }
  const { container } = render(<Fixture />);
  const start = screen.getByRole("slider", { name: "计划起点" });
  start.focus();
  await user.keyboard("{ArrowRight}{ArrowRight}");
  expect(screen.getByRole("slider", { name: "计划起点" })).toHaveAttribute(
    "aria-valuenow",
    "22",
  );
  await expectAccessible(container);
});
