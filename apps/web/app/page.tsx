import Link from "next/link";
import { ArrowRight, GitBranch, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-40" />
      <nav className="container flex items-center justify-between py-6">
        <span className="font-display text-xl">Nexus</span>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Open dashboard <ArrowRight className="h-3 w-3" /></Button>
        </Link>
      </nav>

      <section className="container relative z-10 pt-20 pb-32 text-center">
        <h1 className="font-display text-6xl leading-[1.05] tracking-tight md:text-7xl">
          Any URL in. <br />
          <span className="bg-gradient-to-r from-accent via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Production sprint out.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Paste a link. Nexus reverse-engineers the product, generates a PRD with Gherkin stories, packs
          a two-week sprint, and ships modern Next.js + React Native code mapped to best-in-class components.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg">Launch a project <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Ghost crawl", body: "Playwright + Firecrawl extract DOM, tokens, SEO and form patterns." },
            { icon: Layers, title: "PRD + Gherkin", body: "Vercel AI SDK chain produces PRD, epics, and Given/When/Then." },
            { icon: GitBranch, title: "Sprint + code", body: "Fibonacci points, Mermaid roadmap, and Shadcn / Aceternity mappings." },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-border bg-surface/50 p-6 text-left backdrop-blur">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
