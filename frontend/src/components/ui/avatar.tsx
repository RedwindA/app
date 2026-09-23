import { Avatar as Primitive } from "@base-ui/react/avatar";
import { cn } from "@/lib/utils";
export function Avatar({ className, ...props }: Primitive.Root.Props) {
  return (
    <Primitive.Root
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full border bg-accent",
        className,
      )}
      {...props}
    />
  );
}
export function AvatarImage({ className, ...props }: Primitive.Image.Props) {
  return (
    <Primitive.Image
      className={cn("size-full object-cover", className)}
      {...props}
    />
  );
}
export function AvatarFallback({
  className,
  ...props
}: Primitive.Fallback.Props) {
  return (
    <Primitive.Fallback
      className={cn(
        "grid size-full place-items-center font-mono text-xs",
        className,
      )}
      {...props}
    />
  );
}
