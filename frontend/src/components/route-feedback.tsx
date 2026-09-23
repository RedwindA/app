import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function RoutePending() {
  return (
    <div
      role="status"
      aria-label="正在加载页面"
      className="w-full space-y-4 p-8"
    >
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-24 w-full" />
      <span className="sr-only">正在加载页面…</span>
    </div>
  );
}

export function RouteError() {
  return (
    <main role="alert" className="mx-auto w-full max-w-lg px-6 py-20">
      <h1 className="text-xl font-semibold">页面暂时无法打开</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        可能是网络中断或页面已更新。请检查连接后刷新重试；当前页面未保存的内容会重置。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {/* Browsers cache failed module imports. Reload also recovers stale deployment URLs. */}
        <Button onClick={() => window.location.reload()}>刷新重试</Button>
        <a href="/" className="text-sm text-link">
          返回任务列表
        </a>
      </div>
    </main>
  );
}
