import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./app-error-boundary";
import { expectAccessible } from "@/test/a11y";

it("renders the app when descendants are healthy", () => {
  render(
    <AppErrorBoundary>
      <p>正常页面</p>
    </AppErrorBoundary>,
  );
  expect(screen.getByText("正常页面")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("shows an accessible reload fallback when a provider fails", async () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  function BrokenProvider(): never {
    throw new Error("provider failed");
  }
  try {
    render(
      <AppErrorBoundary>
        <BrokenProvider />
      </AppErrorBoundary>,
    );
    const fallback = screen.getByRole("alert");
    expect(fallback).toHaveTextContent("应用暂时无法显示");
    expect(
      screen.getByRole("button", { name: "刷新应用" }),
    ).toBeInTheDocument();
    await expectAccessible(fallback);
  } finally {
    spy.mockRestore();
  }
});
