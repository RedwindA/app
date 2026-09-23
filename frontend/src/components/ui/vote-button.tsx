import type { ComponentProps } from "react";
import { CaretUpIcon } from "@phosphor-icons/react";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

type VoteButtonProps = Omit<
  ComponentProps<"button">,
  "onChange" | "children"
> & {
  count: number;
  voted: boolean;
  label: string;
  onVotedChange: (voted: boolean) => void;
};

export function VoteButton({
  count,
  voted,
  label,
  onVotedChange,
  className,
  ...props
}: VoteButtonProps) {
  return (
    <button
      type="button"
      aria-label={uiStrings.voteButton.name(label, count)}
      aria-pressed={voted}
      onClick={() => onVotedChange(!voted)}
      className={cn(
        "flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border font-mono text-xs transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        voted
          ? "border-link bg-link text-background"
          : "bg-secondary text-muted-foreground hover:bg-accent",
        className,
      )}
      {...props}
    >
      <CaretUpIcon aria-hidden weight="bold" className="size-3.5" />
      {count}
    </button>
  );
}
