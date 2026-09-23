This is the MinerU → LaTeX web UI, built from a reusable frontend template. Pages: `pages/login.tsx`, `pages/jobs.tsx`, `pages/upload.tsx`, `pages/job-detail.tsx`; job-specific components live in `components/job/`.

# Frontend conventions

Read DESIGN.md before changing UI. This is a standalone frontend starter.

Component and architecture details live in `docs/`: [data-display.md](docs/data-display.md) (charts, tables, lists), [extended-components.md](docs/extended-components.md) (command palette, calendar, date picker, validation, menus, OTP, resizable), [architecture.md](docs/architecture.md) (build chunks, error boundary, theme bootstrap, fonts, LazyMotion, env vars, applying styles to an existing app), [state-and-routing.md](docs/state-and-routing.md) (search params, `useLocalState`).

- Reuse src/components/ui, src/components/primitives.tsx, src/components/toolbar.tsx and src/layouts before creating new components. Search + filter rows use `Toolbar`, `SearchField` and `FilterSelect` from toolbar.tsx; do not hand-roll icon-in-input or `min-w-0 flex-1` search wrappers.
- Route search params: build `validateSearch` with `searchParams({...})` from src/lib/search-params.ts (input stays `Record<string, unknown>`, every key optional, defaults applied in the page). Clear a param with `search: (prev) => ({ ...prev, key: undefined })`. Routes under the `app` layout are addressed as `getRouteApi("/app/<path>")`.
- Preserve the existing visual language unless the user explicitly requests a redesign.
- Use semantic Tailwind colors, Geist fonts, and Phosphor icons. Keep blue for active states and actions.
- Keep database, auth, billing, analytics, environment secrets, and network calls out of UI primitives.
- UI components receive values and callbacks. Connect real data in pages or a dedicated data layer.
- All HTTP calls go through `src/api/client.ts` (axios, bearer token from `src/auth/token.ts`). React Query hooks and mutations live in `src/data/jobs.ts`; pages call those hooks, components under `components/job/` only receive values and callbacks.
- Routing uses TanStack Router with browser history (`src/router.tsx`); the backend serves index.html for every non-API path. `/login` is public, everything under the `app` layout requires a token.
- Keep dark/light modes, mobile layouts, accessible labels, focus behavior, and reduced motion working.
- Do not run a component generator over existing customized components without reviewing the diff.
- Animated components use `motion/react-m` inside the root `MotionProvider` (main.tsx). Keep that provider; do not import `motion` from "motion/react" (LazyMotion is strict).
- Use pnpm. Run pnpm lint, pnpm test, and pnpm build after changes. Run `pnpm test:browser`, and still manually check the interactions your change affects in a browser.
- src/test/setup.ts already stubs ResizeObserver, matchMedia, scrollTo, elementFromPoint and getAnimations for jsdom; add further browser-only APIs there, not per test file.
