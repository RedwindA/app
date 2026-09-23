import { useState, type FormEvent } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { FilePdfIcon } from "@phosphor-icons/react";
import { errorMessage, errorStatus, login } from "@/api/client";
import { setToken } from "@/auth/token";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/config";

const routeApi = getRouteApi("/login");

function loginError(error: unknown): string {
  const status = errorStatus(error);
  if (status === 429) return "尝试次数过多，请一分钟后再试。";
  if (status === 401) return "密码不正确。";
  return `登录失败：${errorMessage(error, "未知错误")}`;
}

export function Login() {
  const { redirect } = routeApi.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { access_token } = await login(password);
      setToken(access_token);
      // Only follow same-origin paths back after sign-in.
      if (redirect?.startsWith("/") && !redirect.startsWith("//"))
        await navigate({ href: redirect, replace: true });
      else await navigate({ to: "/", replace: true });
    } catch (err) {
      setError(loginError(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-sidebar">
      <header className="flex justify-end p-3">
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[12vh] pb-16">
        <div className="w-full max-w-sm">
          <FilePdfIcon weight="duotone" className="size-8 text-tone-teal" />
          <h1 className="mt-5 text-2xl font-semibold">{site.name}</h1>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            {site.description}单用户服务，请输入访问密码。
          </p>
          <form
            onSubmit={onSubmit}
            className="mt-8 flex flex-col gap-4 rounded-xl border bg-background p-5"
          >
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                // eslint-disable-next-line jsx-a11y/no-autofocus -- sole field on the page
                autoFocus
                autoComplete="current-password"
                value={password}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <Alert variant="error" title={error} />}
            <Button type="submit" disabled={busy || !password} arrow full>
              {busy ? "正在登录…" : "登录"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
