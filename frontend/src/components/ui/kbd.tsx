import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-muted px-1 font-mono text-[11px] font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:border-transparent in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background",
        className,
      )}
      {...props}
    />
  );
}

export function KbdGroup({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}
