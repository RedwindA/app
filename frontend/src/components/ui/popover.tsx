import { Popover as Primitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export const PopoverTitle = Primitive.Title;
export const PopoverDescription = Primitive.Description;
export function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: Primitive.Popup.Props &
  Pick<Primitive.Positioner.Props, "align" | "sideOffset">) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <Primitive.Popup
          className={cn(
            "w-72 max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg duration-150 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
