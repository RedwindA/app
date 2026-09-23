import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { MinusIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useContext, type ComponentProps, type ReactNode } from "react";

export function InputOTP({
  className,
  containerClassName,
  label,
  maxLength = 6,
  pattern = REGEXP_ONLY_DIGITS,
  inputMode = "numeric",
  autoComplete = "one-time-code",
  children,
  ...props
}: Omit<
  ComponentProps<typeof OTPInput>,
  "maxLength" | "render" | "children"
> & {
  label: string;
  maxLength?: number;
  children: ReactNode;
}) {
  return (
    <OTPInput
      {...props}
      data-slot="input-otp"
      aria-label={label}
      maxLength={maxLength}
      pattern={pattern}
      inputMode={inputMode}
      autoComplete={autoComplete}
      spellCheck={false}
      containerClassName={cn(
        "group flex items-center has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
    >
      {children}
    </OTPInput>
  );
}

export function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

export function InputOTPSlot({
  index,
  className,
  ...props
}: ComponentProps<"div"> & { index: number }) {
  const { slots } = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-11 items-center justify-center border-y border-r border-input font-mono text-[13px] transition-colors group-has-[input[aria-invalid=true]]:border-destructive first:rounded-l-lg first:border-l last:rounded-r-lg data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/60 sm:size-[34px] dark:bg-input/30 dark:group-has-[input[aria-invalid=true]]:border-destructive/50",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px bg-foreground motion-safe:animate-pulse" />
        </div>
      ) : null}
    </div>
  );
}

export function InputOTPSeparator({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      role="presentation"
      className={cn("flex items-center px-1 text-muted-foreground", className)}
      {...props}
    >
      <MinusIcon aria-hidden className="size-4" />
    </div>
  );
}
