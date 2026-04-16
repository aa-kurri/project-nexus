import { supabaseServer } from "@/lib/supabase/server";

export default async function DebugPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <pre className="p-10 bg-black text-green-400">
      {JSON.stringify(user, null, 2)}
    </pre>
  );
}
