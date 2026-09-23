import type { ComponentProps } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

export function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label={uiStrings.breadcrumb.label}
      className={className}
      {...props}
    />
  );
}
export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:gap-2",
        className,
      )}
      {...props}
    />
  );
}
export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "inline-flex min-w-0 items-center gap-1 sm:gap-2",
        className,
      )}
      {...props}
    />
  );
}
export function BreadcrumbLink({
  className,
  children,
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "inline-flex min-h-11 items-center rounded-sm break-words hover:text-link focus-visible:outline-2 focus-visible:outline-ring sm:min-h-6",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
export function BreadcrumbPage({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      className={cn("break-words text-foreground", className)}
      {...props}
    />
  );
}
/** Place inside the preceding BreadcrumbItem, keeping ol children valid li elements. */
export function BreadcrumbSeparator() {
  return <CaretRightIcon aria-hidden className="size-3 shrink-0" />;
}
