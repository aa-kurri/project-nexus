"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerWithInvite } from "./actions";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Warn early if no invite token
  const missingToken = !inviteToken;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const result = await registerWithInvite({
        invite_token: inviteToken,
        full_name: fullName,
        email,
        password,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to dashboard; cookie is set by the server action
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(220 15% 6%)" }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Wordmark */}
        <div className="text-center">
          <span className="text-2xl font-black tracking-tight text-white">
            Ayura<span className="text-[#0F766E]"> OS</span>
          </span>
          <p className="text-sm text-white/40 mt-1">Staff Registration</p>
        </div>

        <Card
          className="border-0 shadow-2xl p-8"
          style={{ background: "hsl(220 13% 9%)" }}
        >
          {missingToken ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold">Invalid Invite Link</p>
              <p className="text-white/40 text-sm">
                This link is missing an invite token. Please use the link sent to your email or contact your administrator.
              </p>
            </div>
          ) : (
            <>
              {/* Token pill */}
              <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/30">
                <svg className="w-4 h-4 text-[#0F766E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-[#0F766E] text-xs font-mono truncate">
                  Token: {inviteToken.slice(0, 8)}…
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Dr. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#0F766E] focus:ring-[#0F766E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Work Email
                  </label>
                  <Input
                    type="email"
                    placeholder="priya@hospital.com"
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
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#0F766E] focus:ring-[#0F766E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                  {isPending ? "Creating account…" : "Create Account"}
                </Button>
              </form>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-white/25">
          Already have an account?{" "}
          <a href="/auth/login" className="text-[#0F766E] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
