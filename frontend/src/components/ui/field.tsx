import { Field as Primitive } from "@base-ui/react/field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
export function Field({ className, ...props }: Primitive.Root.Props) {
  return <Primitive.Root className={cn("grid gap-2", className)} {...props} />;
}
export const FieldControl = Primitive.Control;
export function FieldLabel(props: Primitive.Label.Props) {
  return <Primitive.Label render={<Label />} {...props} />;
}
export function FieldDescription({
  className,
  ...props
}: Primitive.Description.Props) {
  return (
    <Primitive.Description
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}
export function FieldError({ className, ...props }: Primitive.Error.Props) {
  return (
    <Primitive.Error
      className={cn("text-xs text-destructive", className)}
      {...props}
    />
  );
}
