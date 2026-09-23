import { Accordion as Primitive } from "@base-ui/react/accordion";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const Accordion = Primitive.Root;
export function AccordionItem({ className, ...props }: Primitive.Item.Props) {
  return <Primitive.Item className={cn("border-b", className)} {...props} />;
}
export function AccordionTrigger({
  className,
  children,
  ...props
}: Primitive.Trigger.Props) {
  return (
    <Primitive.Header>
      <Primitive.Trigger
        className={cn(
          "group flex min-h-11 w-full items-center justify-between gap-4 rounded-sm py-3 text-left text-[13px] font-semibold transition-colors outline-none hover:text-link focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <CaretDownIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-panel-open:rotate-180"
        />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}
export function AccordionContent({
  className,
  children,
  ...props
}: Primitive.Panel.Props) {
  // Padding lives on the inner div so the panel can collapse to a true 0 height.
  return (
    <Primitive.Panel
      className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0"
      {...props}
    >
      <div
        className={cn(
          "pb-4 text-[13px] leading-6 text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    </Primitive.Panel>
  );
}
