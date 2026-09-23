import { Tabs as Primitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";
export const Tabs = Primitive.Root;
export function TabsList({
  className,
  children,
  ...props
}: Primitive.List.Props) {
  return (
    <Primitive.List
      className={cn(
        "relative isolate flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-secondary p-1",
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.Indicator className="absolute top-(--active-tab-top) left-(--active-tab-left) -z-10 h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-card transition-[left,top,width,height] duration-200 ease-out" />
    </Primitive.List>
  );
}
export function TabsTrigger({ className, ...props }: Primitive.Tab.Props) {
  return (
    <Primitive.Tab
      className={cn(
        "min-h-9 shrink-0 rounded-md px-3 text-[13px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-active:text-link",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: Primitive.Panel.Props) {
  return (
    <Primitive.Panel
      className={cn(
        "mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
