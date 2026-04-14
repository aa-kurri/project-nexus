import { NextResponse } from "next/server";
import { z } from "zod";
import { ghostCrawl } from "@nexus/crawler-engine";
import { generatePrd } from "@nexus/ai-orchestrator";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({ project_id: z.string().uuid() });

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const sb = supabaseAdmin();

  const { data: project } = await sb.from("projects").select("*").eq("id", body.project_id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    await sb.from("projects").update({ status: "crawling" }).eq("id", project.id);
    const artifact = await ghostCrawl({ url: project.source_url });

    await sb.from("crawl_artifacts").insert({
      project_id: project.id,
      dom_tree: artifact.domTree,
      design_tokens: artifact.designTokens,
      seo: artifact.seo,
      forms: artifact.forms,
      raw_markdown: artifact.rawMarkdown,
    });

    await sb.from("projects").update({ status: "analyzing" }).eq("id", project.id);
    const prd = await generatePrd(artifact);

    await sb.from("requirements").insert({
      project_id: project.id,
      kind: "epic",
      title: prd.title,
      body: prd.vision,
    });

    await sb.from("projects").update({ status: "ready" }).eq("id", project.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    await sb.from("projects").update({ status: "failed", error: String(err) }).eq("id", project.id);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
