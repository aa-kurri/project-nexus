import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { UrlLauncher } from "@/components/dashboard/UrlLauncher";
import { PipelineStatus } from "@/components/dashboard/PipelineStatus";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  // Redirect based on user metadata OR demo email patterns
  if (user) {
    const role = user.user_metadata?.role;
    const email = user.email || "";

    // 1. Hospital Staff / Admin Redirect
    if (
      role === "staff" ||
      role === "admin" ||
      email.endsWith("@citygeneral.demo") && !email.includes("patient.")
    ) {
      redirect("/opd/queue");
    }

    // 2. Patient Portal Redirect
    if (
      role === "patient" ||
      email.includes("patient.") && email.endsWith("@citygeneral.demo")
    ) {
      redirect("/account/security"); // Or a patient home if it exists
    }
  }

  const { data: projects } = await sb
    .from("projects")
    .select("id, name, source_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="container py-12">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted">Paste a URL. Nexus does the rest.</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        <UrlLauncher />
      </div>

      <section className="mt-16">
        <h2 className="mb-4 text-sm uppercase tracking-wider text-muted">Recent projects</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(projects ?? []).length === 0 && (
            <Card><CardDescription>No projects yet — paste a URL above to begin.</CardDescription></Card>
          )}
          {(projects ?? []).map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="transition hover:border-accent/60">
                <CardHeader>
                  <CardTitle className="truncate">{p.name || new URL(p.source_url).hostname}</CardTitle>
                  <CardDescription className="truncate">{p.source_url}</CardDescription>
                </CardHeader>
                <PipelineStatus status={p.status} />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
