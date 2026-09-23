import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export {
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
} from "@/components/ui/dialog";
export function AlertDialogContent({
  className,
  ...props
}: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop className="fixed inset-0 z-50 bg-black/60 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <Primitive.Popup
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border bg-popover p-5 text-popover-foreground shadow-xl duration-150 ease-out outline-none motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98]",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
export function AlertDialogCancel(props: Primitive.Close.Props) {
  return <Primitive.Close render={<Button variant="secondary" />} {...props} />;
}
export function AlertDialogAction(props: Primitive.Close.Props) {
  return (
    <Primitive.Close render={<Button variant="destructive" />} {...props} />
  );
}
