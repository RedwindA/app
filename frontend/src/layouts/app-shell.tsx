import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  FilePdfIcon,
  ListBulletsIcon,
  PlusIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { clearToken, useToken } from "@/auth/token";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { site } from "@/config";
import { queryClient } from "@/data/jobs";

const navigation = [
  { to: "/", label: "任务", icon: ListBulletsIcon },
  { to: "/upload", label: "新建任务", icon: PlusIcon },
] as const;

export function AppShell() {
  const token = useToken();
  const navigate = useNavigate();

  // Sign-out, an expired token (401) or another tab signing out all land here.
  useEffect(() => {
    if (token) return;
    queryClient.clear();
    void navigate({ to: "/login", replace: true });
  }, [token, navigate]);

  return (
    <div className="flex h-dvh flex-col bg-sidebar md:flex-row">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        跳到主要内容
      </a>
      <aside className="flex shrink-0 flex-col border-b px-3 py-3 md:w-[200px] md:border-0 md:py-4">
        <div className="flex items-center justify-between px-2">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 text-[15px] font-semibold"
          >
            <FilePdfIcon
              weight="duotone"
              className="size-5 shrink-0 text-tone-teal"
            />
            <span className="truncate">{site.name}</span>
          </Link>
          <div className="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="退出登录"
              title="退出登录"
              onClick={clearToken}
            >
              <SignOutIcon aria-hidden />
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <nav
          aria-label="主导航"
          className="mt-3 flex gap-1 md:mt-6 md:flex-col"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true, includeSearch: false }}
              className="flex h-9 flex-1 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground md:flex-none"
              activeProps={{ className: "bg-link/10 text-link" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden flex-1 md:block" />
        <div className="mt-6 hidden items-center gap-1 border-t pt-3 md:flex">
          <button
            type="button"
            onClick={clearToken}
            className="flex h-9 flex-1 items-center gap-2.5 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <SignOutIcon className="size-4" />
            退出登录
          </button>
          <ThemeToggle />
        </div>
      </aside>
      <main
        id="main"
        tabIndex={-1}
        className="flex min-h-0 min-w-0 flex-1 p-2 md:py-3 md:pr-3 md:pl-0"
      >
        <Outlet />
      </main>
    </div>
  );
}
