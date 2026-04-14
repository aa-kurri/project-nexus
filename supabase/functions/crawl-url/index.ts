// Supabase Edge Function — proxies to Next.js API route for long-running crawl.
// Deploy with: supabase functions deploy crawl-url --no-verify-jwt
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const body = await req.json();
  const appUrl = Deno.env.get("NEXT_APP_URL")!;
  const res = await fetch(`${appUrl}/api/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return new Response(await res.text(), { status: res.status });
});
