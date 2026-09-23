import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
const badgeVariants = {
  default: "bg-secondary text-muted-foreground",
  active: "border-link/20 bg-link/10 text-link",
  success: "border-tone-teal/20 bg-tone-teal/10 text-tone-teal",
  warning: "border-tone-amber/20 bg-tone-amber/10 text-tone-amber",
  violet: "border-tone-violet/20 bg-tone-violet/10 text-tone-violet",
  rose: "border-tone-rose/20 bg-tone-rose/10 text-tone-rose",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: ComponentProps<"span"> & {
  variant?: keyof typeof badgeVariants;
}) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
