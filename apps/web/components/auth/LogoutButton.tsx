"use client";
import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { handleLogout } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton({ variant = "ghost", className = "" }: { variant?: any, className?: string }) {
  const [isPending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      await handleLogout();
    });
  };

  return (
    <Button
      variant={variant}
      onClick={onLogout}
      disabled={isPending}
      className={className}
    >
      <LogOut className={`mr-2 h-4 w-4 ${isPending ? "animate-pulse" : ""}`} />
      {isPending ? "Logging out..." : "Log Out"}
    </Button>
  );
}
