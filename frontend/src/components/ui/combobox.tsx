import { Combobox as Primitive } from "@base-ui/react/combobox";
import { CaretDownIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** `label` names the input for assistive tech; pass `id` to also bind a visible `<Label htmlFor>`. */
export function Combobox({
  options,
  value,
  onValueChange,
  label,
  id,
  placeholder = uiStrings.combobox.placeholder,
  disabled,
  name,
  className,
}: {
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  label: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value) ?? null;
  return (
    <Primitive.Root
      items={options}
      value={selected}
      onValueChange={(option) => onValueChange(option?.value ?? null)}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={disabled}
      name={name}
    >
      <Primitive.InputGroup
        data-slot="combobox"
        className={cn(
          "relative flex min-h-11 items-center rounded-lg border border-input bg-card focus-within:ring-2 focus-within:ring-ring/60 sm:min-h-[34px]",
          disabled && "opacity-50",
          className,
        )}
      >
        <Primitive.Input
          id={id}
          data-slot="combobox-input"
          aria-label={id ? undefined : label}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-2 pl-3 text-[13px] outline-none focus-visible:outline-none"
        />
        {value !== null && (
          <Primitive.Clear
            aria-label={uiStrings.combobox.clear(label)}
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </Primitive.Clear>
        )}
        <Primitive.Trigger
          aria-label={uiStrings.combobox.expand(label)}
          className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground sm:size-[34px]"
        >
          <CaretDownIcon className="size-4" />
        </Primitive.Trigger>
      </Primitive.InputGroup>
      <Primitive.Portal>
        <Primitive.Positioner sideOffset={6} className="z-50 outline-none">
          <Primitive.Popup className="max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] origin-(--transform-origin) overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Primitive.Empty>
              {/* Empty keeps its live region mounted; only its children disappear. */}
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {uiStrings.combobox.empty}
              </div>
            </Primitive.Empty>
            <Primitive.List>
              {(option: ComboboxOption) => (
                <Primitive.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-md px-3 py-2 text-[13px] outline-none data-highlighted:bg-accent sm:min-h-9 data-selected:text-link data-disabled:opacity-50"
                >
                  {option.label}
                  <Primitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                  </Primitive.ItemIndicator>
                </Primitive.Item>
              )}
            </Primitive.List>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
