import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

function renderToggle() {
  return render(
    <ThemeProvider>
      <MotionProvider>
        <ThemeToggle />
      </MotionProvider>
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.removeItem("latex-app-theme");
    document.documentElement.classList.remove("dark", "theme-transition");
    document.documentElement.style.colorScheme = "";
    Reflect.deleteProperty(document, "startViewTransition");
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark", "theme-transition");
    document.documentElement.style.colorScheme = "";
    localStorage.removeItem("latex-app-theme");
    Reflect.deleteProperty(document, "startViewTransition");
  });

  it("flips the accessible name and resolved theme on click", async () => {
    const user = userEvent.setup();
    renderToggle();
    const toggle = screen.getByRole("button", { name: "切换浅色主题" });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await user.click(toggle);
    expect(
      screen.getByRole("button", { name: "切换深色主题" }),
    ).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("latex-app-theme")).toBe("light");
  });
});
