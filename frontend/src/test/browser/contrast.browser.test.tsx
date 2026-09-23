import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

const badgeVariants = [
  "default",
  "active",
  "success",
  "warning",
  "violet",
  "rose",
  "destructive",
] as const;

const alertVariants = ["info", "success", "warning", "error"] as const;

function Palette() {
  return (
    <div className="bg-background p-6 text-foreground">
      <div className="flex flex-wrap gap-2">
        {badgeVariants.map((variant) => (
          <Badge key={variant} variant={variant} data-variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {alertVariants.map((variant) => (
          <Alert
            key={variant}
            variant={variant}
            data-variant={variant}
            title={`${variant} title`}
          >
            补充说明
          </Alert>
        ))}
      </div>
    </div>
  );
}

function readContrast(node: axe.NodeResult) {
  const check = node.any[0];
  const data: unknown = check?.data;
  const record =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : undefined;
  return {
    target: JSON.stringify(node.target),
    html: node.html,
    contrastRatio:
      typeof record?.contrastRatio === "number"
        ? record.contrastRatio
        : undefined,
    expected:
      typeof record?.expectedContrastRatio === "string"
        ? record.expectedContrastRatio
        : undefined,
    fg: typeof record?.fgColor === "string" ? record.fgColor : undefined,
    bg: typeof record?.bgColor === "string" ? record.bgColor : undefined,
    message: check?.message,
  };
}

function formatFindings(results: readonly axe.Result[]) {
  return results.flatMap((result) => result.nodes.map(readContrast));
}

async function expectContrast(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  const { container } = render(<Palette />);
  const result = await axe.run(container, {
    runOnly: { type: "rule", values: ["color-contrast"] },
    rules: { "color-contrast": { enabled: true } },
  });
  expect(formatFindings(result.incomplete)).toEqual([]);
  expect(formatFindings(result.violations)).toEqual([]);
}

describe("badge and alert contrast", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  it("meets color contrast in the light theme", async () => {
    await expectContrast("light");
  });

  it("meets color contrast in the dark theme", async () => {
    await expectContrast("dark");
  });
});
