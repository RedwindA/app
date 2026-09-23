import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal"
          ? "h-px w-full"
          : "min-h-4 w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}
