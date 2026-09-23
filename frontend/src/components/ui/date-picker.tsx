import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y = "", m = "", d = ""] = value.split("-");
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (year < 1) return undefined;
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return formatDate(date) === value ? date : undefined;
}

function parseInput(value: string) {
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value.trim());
  if (!match) return undefined;
  const [, year = "", month = "", day = ""] = match;
  return parseDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
}

function formatDate(date: Date) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** A text input and shared Calendar; committed values are local YYYY-MM-DD strings. */
export function DatePicker({
  value,
  onValueChange,
  label,
  className,
  id,
  name,
  form,
  disabled,
  readOnly,
  required,
  min,
  max,
  placeholder = "YYYY-MM-DD",
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ref,
  strings,
  ...props
}: Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  strings?: Partial<typeof uiStrings.datePicker>;
}) {
  const copy = { ...uiStrings.datePicker, ...strings };
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState(startOfToday);
  const [draft, setDraft] = useState({ source: value, text: value });
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const text = draft.source === value ? draft.text : value;
  const selected = parseDate(value);
  const earliest = parseDate(String(min ?? ""));
  const latest = parseDate(String(max ?? ""));
  const parsed = parseInput(text);
  const error = !text
    ? required
      ? copy.required
      : ""
    : !parsed
      ? copy.invalid
      : earliest && parsed < earliest
        ? copy.tooEarly(formatDate(earliest))
        : latest && parsed > latest
          ? copy.tooLate(formatDate(latest))
          : "";
  const visibleError = touched ? error : "";
  const todayDisabled = Boolean(
    (earliest && today < earliest) || (latest && today > latest),
  );
  const firstMonth =
    earliest ??
    new Date(
      Math.min(
        today.getFullYear() - 100,
        selected?.getFullYear() ?? today.getFullYear(),
      ),
      0,
      1,
    );
  const lastMonth =
    latest ??
    new Date(
      Math.max(
        today.getFullYear() + 100,
        selected?.getFullYear() ?? today.getFullYear(),
      ),
      11,
      1,
    );
  const initialMonth = selected ?? today;
  const clampedMonth =
    initialMonth < firstMonth
      ? firstMonth
      : initialMonth > lastMonth
        ? lastMonth
        : initialMonth;

  useEffect(() => {
    inputRef.current?.setCustomValidity(error);
  }, [error]);

  const selectDate = (date: Date | undefined) => {
    const next = date ? formatDate(date) : "";
    setDraft({ source: next, text: next });
    setTouched(false);
    onValueChange(next);
    setOpen(false);
  };
  const commitInput = () => {
    setTouched(true);
    if (error) return;
    const next = parsed ? formatDate(parsed) : "";
    setDraft({ source: next, text: next });
    if (next !== value) onValueChange(next);
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <input
        type="hidden"
        name={name}
        form={form}
        value={error ? value : parsed ? formatDate(parsed) : ""}
        disabled={disabled}
      />
      <Popover
        open={open && !disabled && !readOnly}
        onOpenChange={(next) => {
          if (next) setToday(startOfToday());
          setOpen(next);
        }}
      >
        <InputGroup
          className={cn("h-11 rounded-lg bg-card sm:h-[34px]", className)}
        >
          <InputGroupInput
            {...props}
            ref={(element) => {
              inputRef.current = element;
              if (typeof ref === "function") return ref(element);
              if (ref) ref.current = element;
            }}
            id={id}
            form={form}
            type="text"
            aria-label={id ? undefined : label}
            aria-describedby={
              [describedBy, visibleError && errorId]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={Boolean(visibleError) || invalid}
            placeholder={placeholder}
            value={text}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            className="font-mono text-[13px]"
            onChange={(event) => {
              setDraft({ source: value, text: event.target.value });
              setTouched(false);
            }}
            onBlur={(event) => {
              props.onBlur?.(event);
              if (!event.defaultPrevented) commitInput();
            }}
            onKeyDown={(event) => {
              props.onKeyDown?.(event);
              if (event.defaultPrevented || disabled || readOnly) return;
              if (event.key === "Enter") {
                if (text !== value || error) event.preventDefault();
                commitInput();
              } else if (event.key === "ArrowDown" && event.altKey) {
                event.preventDefault();
                setToday(startOfToday());
                setOpen(true);
              } else if (event.key === "Escape") {
                setDraft({ source: value, text: value });
                setTouched(false);
              }
            }}
            onInvalid={(event) => {
              props.onInvalid?.(event);
              if (!event.defaultPrevented) {
                event.preventDefault();
                setTouched(true);
                inputRef.current?.focus();
              }
            }}
          />
          <InputGroupAddon align="inline-end" className="pr-1">
            <PopoverTrigger
              disabled={disabled || readOnly}
              aria-label={copy.open(label)}
              render={
                <InputGroupButton
                  size="icon-sm"
                  className="size-11 sm:size-7"
                />
              }
            >
              <CalendarBlankIcon aria-hidden className="size-4" />
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
        <PopoverContent
          aria-label={label}
          className="w-auto p-2"
          align="end"
          initialFocus={false}
          finalFocus={inputRef}
        >
          <Calendar
            mode="single"
            // Focus the selected day only after the user opens this popover.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            captionLayout="dropdown"
            labels={{
              labelMonthDropdown: () => copy.month,
              labelYearDropdown: () => copy.year,
            }}
            classNames={{
              month_caption:
                "flex h-11 items-center justify-center px-9 font-semibold",
              dropdowns: "flex items-center gap-1 text-xs",
              dropdown_root:
                "relative rounded-md border px-1.5 py-2 focus-within:ring-2 focus-within:ring-ring",
            }}
            required={required}
            defaultMonth={clampedMonth}
            selected={selected}
            onSelect={selectDate}
            disabled={[
              ...(earliest ? [{ before: earliest }] : []),
              ...(latest ? [{ after: latest }] : []),
            ]}
            startMonth={firstMonth}
            endMonth={lastMonth}
          />
          <div className="mt-2 flex justify-between border-t pt-2">
            <Button
              variant="ghost"
              disabled={required || !text}
              onClick={() => selectDate(undefined)}
            >
              {copy.clear}
            </Button>
            <Button
              variant="ghost"
              disabled={todayDisabled}
              onClick={() => selectDate(today)}
            >
              {copy.today}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {visibleError && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {visibleError}
        </p>
      )}
    </div>
  );
}
