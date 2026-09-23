"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react";

function Checkbox({
  className,
  indeterminate,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      indeterminate={indeterminate}
      className={cn(
        "peer group/checkbox relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input transition-[color,background-color,border-color,box-shadow,scale] duration-150 ease-out outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-disabled:scale-90 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-indeterminate:bg-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className,
      )}
      {...props}
    >
      {/* Kept mounted so both marks can transition; the root's data-* state picks which one shows. */}
      <CheckboxPrimitive.Indicator
        keepMounted
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:size-3.5"
      >
        <CheckIcon className="opacity-0 transition-[opacity,clip-path] duration-100 ease-out [clip-path:inset(0_100%_0_0)] group-data-checked/checkbox:opacity-100 group-data-checked/checkbox:duration-200 group-data-checked/checkbox:[clip-path:inset(0)]" />
        <MinusIcon
          weight="bold"
          className="scale-x-0 opacity-0 transition-[opacity,scale] duration-150 ease-out group-data-indeterminate/checkbox:scale-x-100 group-data-indeterminate/checkbox:opacity-100"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
