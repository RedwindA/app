import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
} from "@phosphor-icons/react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { zhCN } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

/** Date values represent calendar days; callers decide storage and timezone policy. */
export function Calendar({
  className,
  classNames,
  components,
  locale = zhCN,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn("w-fit max-w-full text-[13px]", className)}
      classNames={{
        months: "flex flex-wrap gap-6",
        month: "relative space-y-2",
        month_caption:
          "flex h-11 items-center justify-center px-11 font-semibold",
        button_previous:
          "absolute top-0 left-0 grid size-11 place-items-center rounded-lg hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
        button_next:
          "absolute top-0 right-0 grid size-11 place-items-center rounded-lg hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
        month_grid: "w-full border-collapse",
        weekday:
          "h-9 text-center text-[11px] font-normal text-muted-foreground",
        day: "size-11 p-0 text-center sm:size-9",
        day_button:
          "grid size-11 place-items-center rounded-lg font-mono outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 sm:size-9",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
        today: "[&>button]:ring-1 [&>button]:ring-ring",
        outside: "text-faint",
        disabled: "opacity-40",
        hidden: "invisible",
        range_middle:
          "bg-primary/10 [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-link",
        range_start: "rounded-l-lg bg-primary/10",
        range_end: "rounded-r-lg bg-primary/10",
        dropdowns: "flex items-center gap-2",
        dropdown_root:
          "relative rounded-md border px-2 py-1 focus-within:ring-2 focus-within:ring-ring",
        dropdown: "absolute inset-0 w-full cursor-pointer opacity-0",
        caption_label: "flex items-center gap-1",
        footer: "mt-3 text-xs text-muted-foreground",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName }) => {
          const Icon =
            orientation === "left"
              ? CaretLeftIcon
              : orientation === "right"
                ? CaretRightIcon
                : orientation === "up"
                  ? CaretUpIcon
                  : CaretDownIcon;
          return <Icon aria-hidden className={cn("size-4", iconClassName)} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}
