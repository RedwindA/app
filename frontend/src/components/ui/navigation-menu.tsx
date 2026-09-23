import { NavigationMenu as Primitive } from "@base-ui/react/navigation-menu";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

export const navigationMenuTriggerStyle = cva(
  "inline-flex min-h-11 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 data-popup-open:bg-accent data-popup-open:text-foreground data-active:text-link sm:min-h-[34px]",
);

export function NavigationMenu({ className, ...props }: Primitive.Root.Props) {
  return (
    <Primitive.Root
      data-slot="navigation-menu"
      className={cn("relative flex max-w-max items-center", className)}
      {...props}
    />
  );
}

export function NavigationMenuList({
  className,
  ...props
}: Primitive.List.Props) {
  return (
    <Primitive.List
      data-slot="navigation-menu-list"
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      {...props}
    />
  );
}

export const NavigationMenuItem = Primitive.Item;

export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: Primitive.Trigger.Props) {
  return (
    <Primitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}
      <Primitive.Icon className="relative top-px ml-0.5">
        <CaretDownIcon
          aria-hidden
          className="size-3 transition-transform duration-150 group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </Primitive.Icon>
    </Primitive.Trigger>
  );
}

export function NavigationMenuContent({
  className,
  ...props
}: Primitive.Content.Props) {
  return (
    <Primitive.Content
      data-slot="navigation-menu-content"
      className={cn("p-2", className)}
      {...props}
    />
  );
}

export function NavigationMenuLink({
  className,
  ...props
}: Primitive.Link.Props) {
  return (
    <Primitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex min-h-11 flex-col gap-1 rounded-md p-2.5 text-[13px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 sm:min-h-0 data-active:bg-link/10 data-active:text-link",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuViewport({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  ...props
}: Primitive.Positioner.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="isolate z-50"
        {...props}
      >
        <Primitive.Popup
          className={cn(
            "relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg duration-150 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100",
            className,
          )}
        >
          <Primitive.Viewport className="relative size-full overflow-hidden" />
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
