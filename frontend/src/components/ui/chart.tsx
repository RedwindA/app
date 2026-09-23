import { useId, type ReactElement, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

export type ChartSeries = { key: string; label: string; color: string };

/** Compose Recharts directly inside this themed, responsive frame. */
export function ChartContainer({
  title,
  description,
  children,
  className,
  footer,
}: {
  title: string;
  description: string;
  children: ReactElement;
  className?: string;
  footer?: ReactNode;
}) {
  const id = useId();
  return (
    <figure
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="min-w-0 space-y-4"
    >
      <figcaption>
        <h4 id={`${id}-title`} className="text-sm font-semibold">
          {title}
        </h4>
        <p
          id={`${id}-description`}
          className="mt-1 text-xs leading-6 text-muted-foreground"
        >
          {description}
        </p>
      </figcaption>
      <div
        className={cn(
          "h-60 min-w-0 text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-sector:focus-visible]:outline-ring [&_.recharts-surface:focus-visible]:outline-ring",
          className,
        )}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 300, height: 240 }}
        >
          {children}
        </ResponsiveContainer>
      </div>
      {footer}
    </figure>
  );
}

export function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <ul
      aria-label={uiStrings.chart.legend}
      className="flex flex-wrap gap-x-4 gap-y-2"
    >
      {series.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2 rounded-sm"
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | ReadonlyArray<number | string>;
  color?: string;
};
export function ChartTooltipContent({
  active,
  payload,
  label,
  series,
  formatValue = (value) => String(value),
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: ReactNode;
  series: ChartSeries[];
  formatValue?: (value: number | string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="max-w-64 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {label != null && <p className="mb-2 font-medium">{label}</p>}
      <ul className="space-y-2">
        {payload.map((entry, index) => {
          const config = series.find(
            (item) =>
              item.key === String(entry.dataKey) ||
              item.key === String(entry.name),
          );
          const value =
            typeof entry.value === "number" || typeof entry.value === "string"
              ? formatValue(entry.value)
              : "—";
          return (
            <li
              key={`${entry.dataKey}-${index}`}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-sm"
                style={{ background: config?.color ?? entry.color }}
              />
              <span className="text-muted-foreground">
                {config?.label ?? entry.name}
              </span>
              <span className="ml-auto pl-4 font-mono tabular-nums">
                {value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
