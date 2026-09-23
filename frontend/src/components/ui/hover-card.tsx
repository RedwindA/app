import { PreviewCard as Primitive } from "@base-ui/react/preview-card";
import { cn } from "@/lib/utils";

export const HoverCard = Primitive.Root;
export const HoverCardTrigger = Primitive.Trigger;

export function HoverCardContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 8,
  ...props
}: Primitive.Popup.Props &
  Pick<Primitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <Primitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "w-72 max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-lg border bg-popover p-4 text-[13px] text-popover-foreground shadow-lg duration-150 outline-none motion-reduce:animate-none motion-reduce:transition-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
