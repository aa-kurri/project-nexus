import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "pending" | "crawling" | "analyzing" | "planning" | "mapping" | "ready" | "failed";
const ORDER: Stage[] = ["crawling", "analyzing", "planning", "mapping", "ready"];
const LABELS: Record<Stage, string> = {
  pending: "Queued",
  crawling: "Ghost crawl",
  analyzing: "PRD + Gherkin",
  planning: "Sprint plan",
  mapping: "Component map",
  ready: "Ready",
  failed: "Failed",
};

export function PipelineStatus({ status }: { status: Stage }) {
  const currentIdx = ORDER.indexOf(status);
  return (
    <ol className="flex items-center gap-2">
      {ORDER.map((s, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "active" : "idle";
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs",
                state === "done" && "border-accent bg-accent/20 text-accent",
                state === "active" && "border-accent text-accent animate-pulse",
                state === "idle" && "border-border text-muted"
              )}
            >
              {state === "done" ? <Check className="h-3.5 w-3.5" /> :
               state === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
               <Circle className="h-2 w-2 fill-current" />}
            </span>
            <span className={cn("text-xs", state === "idle" ? "text-muted" : "text-fg")}>
              {LABELS[s]}
            </span>
            {i < ORDER.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
