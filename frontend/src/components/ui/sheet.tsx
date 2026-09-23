import { Dialog as Primitive } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";
export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export {
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogFooter as SheetFooter,
} from "@/components/ui/dialog";
export function SheetContent({
  className,
  children,
  ...props
}: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop className="fixed inset-0 z-50 bg-black/60" />
      <Primitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-4 overflow-y-auto border-l bg-popover p-6 text-popover-foreground shadow-xl transition-transform duration-200 outline-none data-ending-style:translate-x-full data-starting-style:translate-x-full motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={uiStrings.sheet.close}
              className="absolute top-3 right-3"
            />
          }
        >
          <XIcon />
        </Primitive.Close>
      </Primitive.Popup>
    </Primitive.Portal>
  );
}
