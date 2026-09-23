import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Adapted from original admin panel; receives content instead of reading app data.
export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
      <header className="flex min-h-[52px] shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 sm:px-5">
        <h1 className="text-[17px] font-semibold">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {/* relative: keeps absolutely positioned children (sr-only) clipped by this scroller. */}
      <div
        className={cn(
          "relative scrollbar-thin min-h-0 flex-1 overflow-auto",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}
