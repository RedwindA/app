import { Toggle as Primitive } from "@base-ui/react/toggle";
import { cn } from "@/lib/utils";

export function Toggle<Value extends string>({
  className,
  ...props
}: Primitive.Props<Value>) {
  return (
    <Primitive
      data-slot="toggle"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 data-pressed:bg-primary/10 data-pressed:text-link motion-reduce:transition-none sm:min-h-[34px] [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
