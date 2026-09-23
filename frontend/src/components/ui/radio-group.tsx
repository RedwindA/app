import { RadioGroup as Group } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { cn } from "@/lib/utils";

export function RadioGroup<Value>({ className, ...props }: Group.Props<Value>) {
  return <Group className={cn("grid gap-2", className)} {...props} />;
}
export function RadioGroupItem({ className, ...props }: Radio.Root.Props) {
  return (
    <Radio.Root
      className={cn(
        "relative flex size-4 shrink-0 items-center justify-center rounded-full border border-input transition-colors outline-none after:absolute after:-inset-3 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 data-checked:border-link data-checked:text-link",
        className,
      )}
      {...props}
    >
      <Radio.Indicator
        keepMounted
        className="size-2 scale-100 rounded-full bg-current transition-transform duration-150 ease-out data-unchecked:scale-0"
      />
    </Radio.Root>
  );
}
