"use client";

import {
  CheckCircleIcon,
  InfoIcon,
  CircleNotchIcon,
  XCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme: theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-4 text-status-shipped" />,
        info: <InfoIcon className="size-4 text-link" />,
        warning: <WarningIcon className="size-4 text-status-planned" />,
        error: <XCircleIcon className="size-4 text-destructive" />,
        loading: <CircleNotchIcon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
