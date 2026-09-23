import { ArrowClockwiseIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";

export function FailurePanel({
  error,
  log,
  logLoading,
  logError,
  onLogOpen,
  onRebuild,
  rebuilding,
  rebuildError,
}: {
  error: string | null;
  log: string | undefined;
  logLoading: boolean;
  logError: boolean;
  onLogOpen: () => void;
  onRebuild: () => void;
  rebuilding: boolean;
  rebuildError: string | null;
}) {
  return (
    <div className="grid gap-5">
      <Alert variant="error" title="任务失败">
        <pre className="font-mono text-xs break-words whitespace-pre-wrap">
          {error ?? "（没有错误信息）"}
        </pre>
      </Alert>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRebuild}
          disabled={rebuilding}
        >
          <ArrowClockwiseIcon aria-hidden />
          {rebuilding ? "正在重新构建…" : "重新构建（跳过 MinerU）"}
        </Button>
        <p className="text-xs text-faint">
          仅用缓存的 MinerU 结果重新合并与编译 LaTeX，适合修复构建问题后重试。
        </p>
      </div>
      {rebuildError && <Alert variant="error" title={rebuildError} />}
      <Collapsible
        onOpenChange={(open) => {
          if (open) onLogOpen();
        }}
      >
        <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <CaretDownIcon
            aria-hidden
            className="size-3.5 transition-transform group-data-[panel-open]:rotate-180"
          />
          latexmk 日志（末尾部分）
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-3">
            {logLoading ? (
              <Spinner>正在读取日志…</Spinner>
            ) : logError || !log ? (
              <p className="text-xs text-muted-foreground">
                没有可用的 latexmk 日志。
              </p>
            ) : (
              <pre className="scrollbar-thin max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap text-foreground">
                {log.slice(-12000)}
              </pre>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
