import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Handles the Supabase OAuth / magic-link / PKCE callback.
 * Exchanges the `code` query param for a session and redirects
 * the user to their intended destination (or /dashboard).
 *
 * Registered in Supabase Dashboard → Auth → URL Configuration
 * as: https://<your-domain>/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` is an optional redirect target set by the middleware
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Absolute redirect — ensure we stay on the same origin
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Exchange failed — redirect to login with an error hint
    return NextResponse.redirect(
      `${origin}/auth/login?error=oauth_callback_failed`
    );
  }

  // No code param — someone landed here directly
  return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
}
