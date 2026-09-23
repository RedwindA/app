import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

// Toolbar keeps the search field on its own grid column so wrapping controls
// can never squeeze it; below `sm` everything stacks in one column.
export function Toolbar({
  search,
  actions,
  children,
  className,
}: {
  search?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        search && "sm:grid-cols-[minmax(14rem,22rem)_1fr] sm:items-center",
        className,
      )}
    >
      {search}
      {(children || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {actions && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SearchField({
  className,
  inputClassName,
  onClear,
  clearLabel = uiStrings.toolbar.clear,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & {
  inputClassName?: string;
  onClear?: () => void;
  clearLabel?: string;
}) {
  const showClear = Boolean(onClear && props.value);
  return (
    <div className={cn("relative min-w-56", className)}>
      <MagnifyingGlassIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        {...props}
        className={cn(
          "h-11 rounded-lg pl-9 sm:h-[34px] [&::-webkit-search-cancel-button]:appearance-none",
          onClear && "pr-11 sm:pr-[34px]",
          inputClassName,
        )}
      />
      {showClear && (
        <Button
          type="button"
          aria-label={clearLabel}
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="absolute top-0 right-0 size-11 sm:size-[34px]"
        >
          <XIcon aria-hidden />
        </Button>
      )}
    </div>
  );
}

export type FilterOption = { value: string; label: string };

// `value === ""` means "no filter"; pass `allLabel` to render that choice.
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  disabled,
  id,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const items = allLabel
    ? [{ value: "", label: allLabel }, ...options]
    : options;
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          "h-11 w-full sm:h-[34px] sm:w-auto sm:min-w-32",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value || "\0"} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
