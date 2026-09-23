import { ScrollArea as Primitive } from "@base-ui/react/scroll-area";
import { cn } from "@/lib/utils";

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: Primitive.Scrollbar.Props) {
  return (
    <Primitive.Scrollbar
      orientation={orientation}
      className={cn(
        "m-1 flex touch-none rounded-full bg-border/40 p-0.5 data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-2",
        className,
      )}
      {...props}
    >
      <Primitive.Thumb className="relative flex-1 rounded-full bg-muted-foreground/40" />
    </Primitive.Scrollbar>
  );
}

/** Give the root a height; label names the focusable, keyboard-scrollable viewport. */
export function ScrollArea({
  className,
  children,
  label,
  ...props
}: Primitive.Root.Props & { label: string }) {
  return (
    <Primitive.Root
      data-slot="scroll-area"
      className={cn("relative min-h-0 min-w-0", className)}
      {...props}
    >
      <Primitive.Viewport
        role="region"
        aria-label={label}
        tabIndex={0}
        className="h-full w-full overscroll-contain rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <Primitive.Content>{children}</Primitive.Content>
      </Primitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <Primitive.Corner />
    </Primitive.Root>
  );
}
