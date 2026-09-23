import { RouteError, RoutePending } from "@/components/route-feedback";
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { getToken } from "@/auth/token";
import { AppShell } from "@/layouts/app-shell";
import { searchEnum, searchParams, searchString } from "@/lib/search-params";

export const jobFilters = ["active", "done", "failed"] as const;

const root = createRootRoute({
  component: Outlet,
  errorComponent: RouteError,
  pendingComponent: RoutePending,
  notFoundComponent: () => (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-xl font-semibold">页面不存在</h1>
      <Link to="/" className="mt-4 inline-block text-link">
        返回任务列表
      </Link>
    </main>
  ),
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: searchParams({ redirect: searchString }),
  beforeLoad: () => {
    if (getToken()) throw redirect({ to: "/" });
  },
  component: lazyRouteComponent(() => import("@/pages/login"), "Login"),
});
const app = createRoute({
  getParentRoute: () => root,
  id: "app",
  beforeLoad: ({ location }) => {
    if (!getToken())
      throw redirect({
        to: "/login",
        search: { redirect: location.href === "/" ? undefined : location.href },
      });
  },
  component: AppShell,
});
const jobs = createRoute({
  getParentRoute: () => app,
  path: "/",
  // Keys are optional; the page applies defaults so the URL stays clean.
  validateSearch: searchParams({
    q: searchString,
    state: searchEnum(jobFilters),
  }),
  component: lazyRouteComponent(() => import("@/pages/jobs"), "Jobs"),
});
const upload = createRoute({
  getParentRoute: () => app,
  path: "/upload",
  component: lazyRouteComponent(() => import("@/pages/upload"), "Upload"),
});
const jobDetail = createRoute({
  getParentRoute: () => app,
  path: "/jobs/$jobId",
  component: lazyRouteComponent(
    () => import("@/pages/job-detail"),
    "JobDetail",
  ),
});

// Browser history: the backend returns index.html for every non-API path.
export const router = createRouter({
  routeTree: root.addChildren([
    login,
    app.addChildren([jobs, upload, jobDetail]),
  ]),
  history: createBrowserHistory(),
  defaultPreload: "intent",
  defaultErrorComponent: RouteError,
  defaultPendingComponent: RoutePending,
  defaultPendingMs: 150,
  defaultPendingMinMs: 250,
  scrollRestoration: true,
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
