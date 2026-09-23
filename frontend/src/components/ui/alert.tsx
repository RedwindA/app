import { useId, type ComponentProps, type ReactNode } from "react";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const variants = {
  info: {
    icon: InfoIcon,
    style: "text-link",
    surface: "border-link/20 bg-link/5",
  },
  success: {
    icon: CheckCircleIcon,
    style: "text-status-shipped",
    surface: "border-status-shipped/20 bg-status-shipped/5",
  },
  warning: {
    icon: WarningIcon,
    style: "text-status-planned",
    surface: "border-status-planned/20 bg-status-planned/5",
  },
  error: {
    icon: WarningCircleIcon,
    style: "text-destructive",
    surface: "border-destructive/20 bg-destructive/5",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  variant?: keyof typeof variants;
  title: ReactNode;
}) {
  const id = useId();
  const { icon: Icon, style, surface } = variants[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-labelledby={id}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-[13px]",
        surface,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", style)} />
      <div className="min-w-0 flex-1">
        <div id={id} className="font-semibold">
          {title}
        </div>
        {children && (
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
