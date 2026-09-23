import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Table({
  className,
  containerProps,
  ...props
}: ComponentProps<"table"> & { containerProps?: ComponentProps<"div"> }) {
  return (
    <div
      {...containerProps}
      className={cn("max-w-full overflow-x-auto", containerProps?.className)}
    >
      <table
        className={cn("w-full border-collapse text-left", className)}
        {...props}
      />
    </div>
  );
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b", className)} {...props} />;
}
export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}
export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn("border-t bg-muted font-medium", className)}
      {...props}
    />
  );
}
export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b transition-colors hover:bg-accent/40", className)}
      {...props}
    />
  );
}
export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 px-3 text-left text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-3 py-3 text-[13px]", className)} {...props} />;
}
export function TableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      className={cn("mt-3 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}
