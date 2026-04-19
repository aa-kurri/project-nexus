"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PatientLogin from "@/components/auth/PatientLogin";

type Tab = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      
      const user = data.user;
      if (user) {
        // Fetch role from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          const rolePathMap: Record<string, string> = {
            'admin': '/dashboard',
            'doctor': '/opd/queue',
            'nurse': '/ipd/nurse-station',
            'pharmacist': '/pharmacy/stock',
            'lab_manager': '/lims/worklist',
            'patient': '/account/security'
          };
          router.push(rolePathMap[profile.role] || '/dashboard');
        } else {
          router.push("/dashboard");
        }
      }
      router.refresh();
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(220 15% 6%)" }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Wordmark */}
        <div className="text-center">
          <span className="text-2xl font-black tracking-tight text-white">
            Ayura<span className="text-[#0F766E]"> OS</span>
          </span>
          <p className="text-sm text-white/40 mt-1">Hospital Operating System</p>
        </div>

        <Card
          className="border-0 shadow-2xl p-8"
          style={{ background: "hsl(220 13% 9%)" }}
        >
          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden mb-8 border border-white/10">
            <button
              onClick={() => setTab("password")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === "password"
                  ? "bg-[#0F766E] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setTab("otp")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === "otp"
                  ? "bg-[#0F766E] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Sign in with Phone
            </button>
          </div>

          {tab === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Work Email
                </label>
                <Input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#0F766E] focus:ring-[#0F766E]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#0F766E] focus:ring-[#0F766E]"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm rounded-md bg-red-500/10 px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-6 text-base font-semibold mt-2"
              >
                {isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          ) : (
            /* Reuse the PatientLogin OTP component — it handles phone + OTP steps */
            <div className="-mx-8 -mb-8">
              <PatientLogin />
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-white/25">
          New staff member?{" "}
          <span className="text-[#0F766E]">
            Use the invite link sent to your email.
          </span>
        </p>
      </div>
    </div>
  );
}
