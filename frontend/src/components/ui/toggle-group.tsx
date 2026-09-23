import { ToggleGroup as Primitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

export { Toggle as ToggleGroupItem } from "@/components/ui/toggle";

export function ToggleGroup<Value extends string>({
  className,
  ...props
}: Primitive.Props<Value>) {
  return (
    <Primitive
      data-slot="toggle-group"
      className={cn(
        "flex w-fit gap-1 rounded-lg border p-1 data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}
