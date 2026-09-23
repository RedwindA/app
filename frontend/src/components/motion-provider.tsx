import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

const loadMotion = () =>
  import("@/lib/motion-features").then((module) => module.default);

// Mounted once in main.tsx. Without it, m.* components stay at their initial (often invisible) state.
// Features load in a separate async chunk, so they never block first paint.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotion} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
