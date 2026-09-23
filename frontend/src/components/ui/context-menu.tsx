import { ContextMenu as Primitive } from "@base-ui/react/context-menu";
import { cn } from "@/lib/utils";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { ComponentProps, KeyboardEvent } from "react";

export const ContextMenu = Primitive.Root;
export const ContextMenuGroup = DropdownMenuGroup;
export const ContextMenuRadioGroup = DropdownMenuRadioGroup;
export const ContextMenuLabel = DropdownMenuLabel;
export const ContextMenuItem = DropdownMenuItem;
export const ContextMenuCheckboxItem = DropdownMenuCheckboxItem;
export const ContextMenuRadioItem = DropdownMenuRadioItem;
export const ContextMenuSeparator = DropdownMenuSeparator;
export const ContextMenuShortcut = DropdownMenuShortcut;
export const ContextMenuSub = DropdownMenuSub;
export const ContextMenuSubTrigger = DropdownMenuSubTrigger;
export const ContextMenuSubContent = DropdownMenuSubContent;

function isKeyboardContextMenu(event: KeyboardEvent) {
  return event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
}

/** Opens on right-click, long-press, Shift+F10, or the ContextMenu key. */
export function ContextMenuTrigger({
  onKeyDown,
  tabIndex = 0,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      data-slot="context-menu-trigger"
      tabIndex={tabIndex}
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !isKeyboardContextMenu(event)) return;
        event.preventDefault();
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        target.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        );
      }}
    />
  );
}

export function ContextMenuContent({
  className,
  align = "start",
  side = "right",
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="context-menu-content"
      align={align}
      side={side}
      sideOffset={sideOffset}
      className={cn("w-auto min-w-36", className)}
      {...props}
    />
  );
}
