import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e1e] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-400 to-cyan-400 text-[#1e1e1e] font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02]",
        destructive:
          "bg-gradient-to-r from-red-400 to-rose-400 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30",
        outline:
          "border border-[#3a3a3a] bg-[#262626] text-[#f5f5f5] hover:bg-[#333333] hover:border-[#4a4a4a]",
        secondary: "bg-[#333333] text-[#f5f5f5] hover:bg-[#3a3a3a]",
        ghost: "text-[#a8a8a8] hover:bg-[#333333] hover:text-[#f5f5f5]",
        link: "text-[#5eead4] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
