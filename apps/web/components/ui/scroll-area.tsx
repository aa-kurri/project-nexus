import { cn } from "@/lib/utils";

export function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border", className)}
      {...props}
    >
      {children}
    </div>
  );
}
