import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

/** Controlled, one-based pagination. Zero results still show a disabled page 1. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  disabled = false,
  className,
  label = uiStrings.pagination.label,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const count = Math.max(1, Math.floor(pageCount) || 1);
  const current = Math.min(count, Math.max(1, Math.floor(page) || 1));
  return (
    <nav
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 sm:size-[34px]"
        aria-label={uiStrings.pagination.previous}
        disabled={disabled || current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        <CaretLeftIcon />
      </Button>
      <span
        role="status"
        className="min-w-24 text-center font-mono text-xs text-muted-foreground"
      >
        {uiStrings.pagination.page(current, count)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 sm:size-[34px]"
        aria-label={uiStrings.pagination.next}
        disabled={disabled || current >= count}
        onClick={() => onPageChange(current + 1)}
      >
        <CaretRightIcon />
      </Button>
    </nav>
  );
}
