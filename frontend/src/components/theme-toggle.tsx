import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { uiStrings } from "@/components/ui/strings";

const EASE = [0.23, 1, 0.32, 1] as const;
const INSTANT = { duration: 0 } as const;
const SWAP = { duration: 0.2, ease: EASE } as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const dark = resolvedTheme === "dark";
  const transition = reduced ? INSTANT : SWAP;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        dark ? uiStrings.themeToggle.toLight : uiStrings.themeToggle.toDark
      }
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className="grid" aria-hidden="true">
        <m.span
          className="pointer-events-none col-start-1 row-start-1"
          initial={false}
          animate={{
            opacity: dark ? 1 : 0,
            scale: dark ? 1 : 0.8,
            rotate: dark ? 0 : 90,
          }}
          transition={transition}
        >
          <SunIcon />
        </m.span>
        <m.span
          className="pointer-events-none col-start-1 row-start-1"
          initial={false}
          animate={{
            opacity: dark ? 0 : 1,
            scale: dark ? 0.8 : 1,
            rotate: dark ? -90 : 0,
          }}
          transition={transition}
        >
          <MoonIcon />
        </m.span>
      </span>
    </Button>
  );
}
