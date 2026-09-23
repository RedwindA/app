import type { ComponentProps } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

/** Visible children replace the screen-reader-only label so the status is announced once. */
export function Spinner({
  label = uiStrings.spinner.label,
  children,
  className,
  ...props
}: ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <CircleNotchIcon
        aria-hidden
        className="size-4 motion-safe:animate-spin"
      />
      {children ?? <span className="sr-only">{label}</span>}
    </span>
  );
}
