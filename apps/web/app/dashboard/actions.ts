"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

const InputSchema = z.object({ url: z.string().url() });

export async function startProject(url: string) {
  const parsed = InputSchema.safeParse({ url });
  if (!parsed.success) return { ok: false as const, error: "Enter a valid URL" };

  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to start a project" };

  const host = new URL(parsed.data.url).hostname.replace(/^www\./, "");
  const { data, error } = await sb
    .from("projects")
    .insert({ owner_id: user.id, name: host, source_url: parsed.data.url, status: "pending" })
    .select("id")
    .single();

  if (error || !data) return { ok: false as const, error: error?.message ?? "Insert failed" };

  // Kick off async pipeline via edge function (non-blocking).
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crawl-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ project_id: data.id }),
  }).catch(() => { /* swallow — pipeline will retry */ });

  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}
