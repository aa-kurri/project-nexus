import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { toMobileRole, type MobileRole, type Profile } from "../lib/supabase";

interface AuthState {
  session:    Session | null;
  profile:    Profile | null;
  mobileRole: MobileRole;
  isLoading:  boolean;

  setSession:  (session: Session | null) => void;
  setProfile:  (profile: Profile) => void;
  clearAuth:   () => void;
  setLoading:  (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session:    null,
  profile:    null,
  mobileRole: "patient",
  isLoading:  true,

  setSession:  (session)  => set({ session }),
  setProfile:  (profile)  => set({ profile, mobileRole: toMobileRole(profile.role) }),
  clearAuth:   ()         => set({ session: null, profile: null, mobileRole: "patient" }),
  setLoading:  (isLoading) => set({ isLoading }),
}));
