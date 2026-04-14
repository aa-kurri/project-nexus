import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (n) => store.get(n)?.value,
        set:    (n, v, o) => store.set({ name: n, value: v, ...o }),
        remove: (n, o) => store.set({ name: n, value: "", ...o }),
      },
    }
  );
}

export function supabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
