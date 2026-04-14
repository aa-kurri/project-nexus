"use client";

import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  action?: { label: string; href: string };
}

export function TopBar({ title, action }: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-sm">
      <h1 className="font-display text-xl font-semibold tracking-tight text-fg">{title}</h1>
      <div className="flex items-center gap-3">
        {action && (
          <Link href={action.href}>
            <Button size="sm" variant="primary">
              <Plus className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          </Link>
        )}
        <button className="relative rounded-lg p-2 text-muted hover:bg-surface hover:text-fg transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#0F766E]" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0F766E] to-teal-400 text-xs font-bold text-white flex items-center justify-center">
          Dr
        </div>
      </div>
    </header>
  );
}
