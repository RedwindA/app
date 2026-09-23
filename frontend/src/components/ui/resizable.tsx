import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function ResizablePanelGroup({
  className,
  resizeTargetMinimumSize = { coarse: 44, fine: 20 },
  ...props
}: ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      resizeTargetMinimumSize={resizeTargetMinimumSize}
      className={cn(className)}
      {...props}
    />
  );
}

export function ResizablePanel({
  className,
  ...props
}: ComponentProps<typeof Panel>) {
  return (
    <Panel
      data-slot="resizable-panel"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

export function ResizableHandle({
  label,
  withHandle = false,
  className,
  ...props
}: ComponentProps<typeof Separator> & {
  label: string;
  withHandle?: boolean;
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      aria-label={label}
      className={cn(
        // 12px after: sliver is only a pointer fallback. Touch 44px comes from
        // Group resizeTargetMinimumSize.coarse, not this pseudo-element.
        "relative flex w-px items-center justify-center bg-border outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 focus-visible:ring-2 focus-visible:ring-ring/60 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-3 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-6 w-3 items-center justify-center rounded-sm border bg-card">
          <DotsSixVerticalIcon
            aria-hidden
            className="size-3 text-muted-foreground"
          />
        </div>
      ) : null}
    </Separator>
  );
}
