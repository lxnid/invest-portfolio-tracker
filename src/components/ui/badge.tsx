"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[#5eead4]/15 text-[#5eead4] border-[#5eead4]/30",
      success: "bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30",
      warning: "bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30",
      destructive: "bg-[#f87171]/15 text-[#f87171] border-[#f87171]/30",
      outline: "bg-transparent text-[#a8a8a8] border-[#3a3a3a]",
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
