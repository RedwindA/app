import { Component, type ReactNode } from "react";

/** Kept independent of providers and routing so their render failures can recover. */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main role="alert" className="mx-auto w-full max-w-lg px-6 py-20">
        <h1 className="text-xl font-semibold">应用暂时无法显示</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          请刷新页面重试，当前页面未保存的内容会重置。
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          刷新应用
        </button>
      </main>
    );
  }
}
