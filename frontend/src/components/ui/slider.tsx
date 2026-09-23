import { Slider as Primitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

const thumbClass =
  "relative size-4 rounded-full border-2 border-link bg-card outline-none after:absolute after:-inset-3 focus-visible:ring-2 focus-visible:ring-ring/60";

/** Single-value horizontal slider; native input and keyboard behavior come from Base UI. */
export function Slider({
  label,
  className,
  ...props
}: Omit<Primitive.Root.Props<number>, "orientation" | "children"> & {
  label: string;
}) {
  return (
    <Primitive.Root
      className={cn("w-full data-disabled:opacity-50", className)}
      {...props}
    >
      <Primitive.Control className="flex h-11 w-full touch-none items-center select-none">
        <Primitive.Track className="relative h-1.5 w-full rounded-full bg-muted">
          <Primitive.Indicator className="rounded-full bg-link" />
          <Primitive.Thumb aria-label={label} className={thumbClass} />
        </Primitive.Track>
      </Primitive.Control>
    </Primitive.Root>
  );
}

/** Two-thumb range slider. Values are a `[start, end]` pair; labels name each thumb. */
export function RangeSlider({
  startLabel,
  endLabel,
  className,
  minStepsBetweenValues = 1,
  ...props
}: Omit<Primitive.Root.Props<readonly number[]>, "orientation" | "children"> & {
  startLabel: string;
  endLabel: string;
}) {
  return (
    <Primitive.Root
      className={cn("w-full data-disabled:opacity-50", className)}
      minStepsBetweenValues={minStepsBetweenValues}
      {...props}
    >
      <Primitive.Control className="flex h-11 w-full touch-none items-center select-none">
        <Primitive.Track className="relative h-1.5 w-full rounded-full bg-muted">
          <Primitive.Indicator className="rounded-full bg-link" />
          <Primitive.Thumb
            index={0}
            aria-label={startLabel}
            className={thumbClass}
          />
          <Primitive.Thumb
            index={1}
            aria-label={endLabel}
            className={thumbClass}
          />
        </Primitive.Track>
      </Primitive.Control>
    </Primitive.Root>
  );
}
