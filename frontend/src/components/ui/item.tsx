import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function ItemGroup({ className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("divide-y border-y", className)} {...props} />;
}
export function Item({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      className={cn("flex min-w-0 items-center gap-3 py-4 sm:gap-4", className)}
      {...props}
    />
  );
}
export function ItemMedia({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5",
        className,
      )}
      {...props}
    />
  );
}
export function ItemContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-w-0 flex-1", className)} {...props} />;
}
export function ItemTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("text-[15px] font-semibold break-words", className)}
      {...props}
    />
  );
}
export function ItemDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mt-1 text-xs leading-6 break-words text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function ItemActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}
