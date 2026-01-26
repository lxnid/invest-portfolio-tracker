"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      success: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      destructive: "bg-red-500/15 text-red-500 border-red-500/30",
      outline: "bg-transparent text-zinc-400 border-zinc-800",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
