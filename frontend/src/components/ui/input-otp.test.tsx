import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { expectAccessible } from "@/test/a11y";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";

it("accepts a six-digit code from the keyboard and paste", async () => {
  const user = userEvent.setup();
  function Fixture() {
    const [code, setCode] = useState("");
    return (
      <div>
        <InputOTP label="验证码" value={code} onChange={setCode} maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p>{code.length === 6 ? `已输入 ${code}` : "未完成"}</p>
      </div>
    );
  }
  const { container } = render(<Fixture />);
  const input = screen.getByLabelText("验证码");
  await user.click(input);
  await user.paste("123456");
  expect(screen.getByText("已输入 123456")).toBeInTheDocument();
  await expectAccessible(container);
});

it("surfaces aria-invalid on the visible slots", () => {
  render(
    <InputOTP label="验证码" aria-invalid value="12" maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
    </InputOTP>,
  );
  const input = screen.getByLabelText("验证码");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input.closest("[data-input-otp-container]")).toHaveClass("group");
  expect(document.querySelector("[data-slot=input-otp-slot]")).toHaveClass(
    "group-has-[input[aria-invalid=true]]:border-destructive",
  );
});
