import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  label,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  value?: number | null;
  max?: number;
  label: string;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const current =
    value == null || !Number.isFinite(value)
      ? undefined
      : Math.min(limit, Math.max(0, value));
  return (
    <div
      {...props}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={current}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-link",
          current === undefined && "w-1/3 motion-safe:animate-pulse",
        )}
        style={
          current === undefined
            ? undefined
            : { width: `${(current / limit) * 100}%` }
        }
      />
    </div>
  );
}
