import { Select as Primitive } from "@base-ui/react/select";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const Select = Primitive.Root;
export const SelectValue = Primitive.Value;
export const SelectGroup = Primitive.Group;
export const SelectLabel = Primitive.Label;
export function SelectTrigger({
  className,
  children,
  ...props
}: Primitive.Trigger.Props) {
  return (
    <Primitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-[34px] w-full items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.Icon className="shrink-0">
        <CaretDownIcon className="size-4 text-muted-foreground" />
      </Primitive.Icon>
    </Primitive.Trigger>
  );
}
export function SelectContent({
  className,
  children,
  ...props
}: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        sideOffset={6}
        alignItemWithTrigger={false}
        className="z-50 outline-none"
      >
        <Primitive.Popup
          className={cn(
            "max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <Primitive.List>{children}</Primitive.List>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
export function SelectItem({
  className,
  children,
  ...props
}: Primitive.Item.Props) {
  return (
    <Primitive.Item
      className={cn(
        "flex min-h-11 cursor-default items-center justify-between gap-4 rounded-md px-2.5 py-2 text-[13px] outline-none data-highlighted:bg-accent sm:min-h-9 data-selected:text-link data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
