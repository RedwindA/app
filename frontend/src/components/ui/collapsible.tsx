import { Collapsible as Primitive } from "@base-ui/react/collapsible";
import { cn } from "@/lib/utils";

export const Collapsible = Primitive.Root;
export const CollapsibleTrigger = Primitive.Trigger;

export function CollapsibleContent({
  className,
  ...props
}: Primitive.Panel.Props) {
  return (
    <Primitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden text-[13px] leading-6 text-muted-foreground transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      {...props}
    />
  );
}
