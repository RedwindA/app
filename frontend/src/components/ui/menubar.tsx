import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ComponentProps } from "react";

export function Menubar({
  className,
  modal = false,
  ...props
}: ComponentProps<typeof MenubarPrimitive>) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      modal={modal}
      className={cn(
        "flex flex-wrap items-center gap-0.5 rounded-lg border bg-card p-0.5",
        className,
      )}
      {...props}
    />
  );
}

export const MenubarMenu = DropdownMenu;
export const MenubarPortal = DropdownMenuPortal;
export const MenubarGroup = DropdownMenuGroup;
export const MenubarRadioGroup = DropdownMenuRadioGroup;
export const MenubarSub = DropdownMenuSub;
export const MenubarShortcut = DropdownMenuShortcut;
export const MenubarItem = DropdownMenuItem;
export const MenubarCheckboxItem = DropdownMenuCheckboxItem;
export const MenubarRadioItem = DropdownMenuRadioItem;
export const MenubarLabel = DropdownMenuLabel;
export const MenubarSeparator = DropdownMenuSeparator;
export const MenubarSubTrigger = DropdownMenuSubTrigger;
export const MenubarSubContent = DropdownMenuSubContent;

export function MenubarTrigger({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        "inline-flex min-h-11 items-center rounded-md px-2.5 text-[13px] font-medium text-muted-foreground outline-none select-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 data-popup-open:bg-accent data-popup-open:text-foreground sm:min-h-[34px]",
        className,
      )}
      {...props}
    />
  );
}

export function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn("w-auto min-w-36", className)}
      {...props}
    />
  );
}
