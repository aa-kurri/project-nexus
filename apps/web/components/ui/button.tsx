import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent/90 shadow-[0_0_0_1px_hsl(265_90%_65%/0.5),0_8px_30px_-12px_hsl(265_90%_65%/0.6)]",
        ghost:   "hover:bg-surface text-fg",
        outline: "border border-border bg-transparent hover:bg-surface",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
