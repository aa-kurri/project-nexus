"use client";

import { handleLogout } from "@/app/actions";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    handleLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#0F766E] mx-auto mb-4" />
        <p className="text-muted text-sm">Signing you out safely...</p>
      </div>
    </div>
  );
}
