import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#3a3a3a] bg-[#262626] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#666666] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[#5eead4]/50 focus:border-[#5eead4]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
