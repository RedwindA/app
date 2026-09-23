import { StrictMode } from "react";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/data/jobs";
import { router } from "./router";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MotionProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
            <Toaster position="bottom-right" />
          </MotionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
