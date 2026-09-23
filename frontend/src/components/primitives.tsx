import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">
      {children}
    </div>
  );
}

export function StatusChip({
  label,
  color = "var(--status-progress)",
}: {
  label: string;
  color?: string;
}) {
  return (
    <span
      className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span className="size-[6px] rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function Row({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-t py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        {help && (
          <p className="mt-1 text-xs leading-relaxed text-faint">{help}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
