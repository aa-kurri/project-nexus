"use client";
import { useState, useTransition } from "react";
import { Sparkles, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startProject } from "@/app/dashboard/actions";

export function UrlLauncher() {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await startProject(url);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 p-2 shadow-2xl shadow-black/40 backdrop-blur-lg focus-within:border-accent/60 focus-within:shadow-accent/20 transition">
        <Globe className="ml-3 h-5 w-5 text-muted" />
        <input
          type="url"
          required
          placeholder="https://stripe.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={pending}
          className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted"
        />
        <Button size="lg" disabled={pending || !url}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {pending ? "Launching" : "Generate"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
