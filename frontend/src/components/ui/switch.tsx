import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

export function Switch({
  label,
  className,
  ...props
}: SwitchPrimitive.Root.Props & { label: string }) {
  return (
    <SwitchPrimitive.Root
      aria-label={label}
      className={cn(
        "group relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full border border-input bg-secondary p-0.5 transition-colors before:absolute before:-inset-x-1 before:-inset-y-3 disabled:opacity-50 data-checked:border-link data-checked:bg-link",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-3.5 rounded-full bg-muted-foreground transition-transform group-data-checked:translate-x-[14px] group-data-checked:bg-background" />
    </SwitchPrimitive.Root>
  );
}
