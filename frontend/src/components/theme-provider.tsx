import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = Exclude<Theme, "system">;
const storageKey = "latex-app-theme";
const mediaQuery = "(prefers-color-scheme: dark)";
const valid = (value: unknown): value is Theme =>
  value === "dark" || value === "light" || value === "system";
function readTheme(): Theme {
  try {
    const value = localStorage.getItem(storageKey);
    return valid(value) ? value : "dark";
  } catch {
    return "dark";
  }
}
const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (value: string) => void;
} | null>(null);

const THEME_TRANSITION_MS = 250;
let themeTransitionTimer: ReturnType<typeof setTimeout> | undefined;
let activeViewTransition: ViewTransition | undefined;

export function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#0d0d0f" : "#f7f5f0");
}

export function clearThemeTransition() {
  if (themeTransitionTimer !== undefined) {
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = undefined;
  }
  document.documentElement.classList.remove(
    "theme-transition",
    "theme-view-transition",
  );
}

export function transitionTheme(apply: () => void) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    apply();
    return;
  }
  if (typeof document.startViewTransition === "function") {
    // ::view-transition-new renders the live DOM, so a second transition
    // mid-fade would snap the first to its end state and re-snapshot. Just
    // apply() and let the in-flight fade converge on the new theme instead.
    if (activeViewTransition) {
      apply();
      return;
    }
    try {
      const transition = document.startViewTransition(apply);
      activeViewTransition = transition;
      // Pointer events hit <html> while the snapshot covers the page; the class
      // disables text selection so a fast double-click can't select the nav.
      document.documentElement.classList.add("theme-view-transition");
      void transition.finished
        .catch(() => {
          /* skipTransition rejects finished; the marker still has to clear. */
        })
        .finally(() => {
          if (activeViewTransition === transition) {
            activeViewTransition = undefined;
            document.documentElement.classList.remove("theme-view-transition");
          }
        });
      return;
    } catch {
      apply();
      return;
    }
  }
  const root = document.documentElement;
  root.classList.add("theme-transition");
  apply();
  if (themeTransitionTimer !== undefined) {
    clearTimeout(themeTransitionTimer);
  }
  themeTransitionTimer = setTimeout(() => {
    root.classList.remove("theme-transition");
    themeTransitionTimer = undefined;
  }, THEME_TRANSITION_MS);
}

// index.html resolves the same theme before first paint; this provider keeps it in sync.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(readTheme);
  const [systemDark, setSystemDark] = useState(
    () => matchMedia(mediaQuery).matches,
  );
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;
  useEffect(() => {
    const media = matchMedia(mediaQuery);
    const update = () => setSystemDark(media.matches);
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        updateTheme(readTheme());
    };
    media.addEventListener("change", update);
    window.addEventListener("storage", sync);
    update();
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", sync);
    };
  }, []);
  // Bootstrap (and StrictMode's second effect) already painted the class;
  // only animate when the resolved theme actually changes the document.
  useLayoutEffect(() => {
    const alreadyApplied =
      document.documentElement.classList.contains("dark") ===
      (resolvedTheme === "dark");
    if (alreadyApplied) {
      applyResolvedTheme(resolvedTheme);
      return;
    }
    transitionTheme(() => applyResolvedTheme(resolvedTheme));
  }, [resolvedTheme]);
  useEffect(() => () => clearThemeTransition(), []);
  const setTheme = (value: string) => {
    if (!valid(value)) return;
    updateTheme(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* Theme still works for this session. */
    }
  };
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme requires ThemeProvider");
  return context;
}
