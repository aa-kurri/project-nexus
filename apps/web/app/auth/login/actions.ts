"use server";

// TODO: S-AUTH-FLOW — server-side sign-in helpers
// These are reserved for SSR sign-in flows (e.g. form POST without JS).
// The client-side page.tsx uses supabase browser client directly for now.

/**
 * signInWithEmailServer
 * TODO: Call supabase.auth.signInWithPassword on the server and return
 *       a redirect response so the session cookie is set server-side.
 */
export async function signInWithEmailServer(
  _email: string,
  _password: string
): Promise<{ error: string | null }> {
  // TODO: import supabaseServer from "@/lib/supabase/server"
  // const supabase = supabaseServer();
  // const { error } = await supabase.auth.signInWithPassword({ email, password });
  // if (error) return { error: error.message };
  // redirect("/dashboard");
  return { error: null };
}

/**
 * requestOtpServer
 * TODO: Send OTP via supabase.auth.signInWithOtp({ phone }) or
 *       via WhatsApp/ABDM gateway edge function.
 */
export async function requestOtpServer(
  _phone: string
): Promise<{ error: string | null }> {
  // TODO: const supabase = supabaseServer();
  // const { error } = await supabase.auth.signInWithOtp({ phone });
  // return { error: error?.message ?? null };
  return { error: null };
}

/**
 * verifyOtpServer
 * TODO: Verify the 6-digit OTP and redirect to /dashboard on success.
 */
export async function verifyOtpServer(
  _phone: string,
  _token: string
): Promise<{ error: string | null }> {
  // TODO: const supabase = supabaseServer();
  // const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  // if (error) return { error: error.message };
  // redirect("/dashboard");
  return { error: null };
}
