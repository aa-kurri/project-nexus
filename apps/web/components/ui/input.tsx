import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);
