import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { toMobileRole, type MobileRole, type Profile } from "../lib/supabase";

interface AuthState {
  session:     Session | null;
  profile:     Profile | null;
  mobileRole:  MobileRole;
  isLoading:   boolean;

  // Multi-hospital: staff can be associated with multiple tenants
  availableTenants: { id: string; name: string; logo?: string }[];
  activeTenantId:   string | null;

  setSession:         (session: Session | null) => void;
  setProfile:         (profile: Profile) => void;
  clearAuth:          () => void;
  setLoading:         (loading: boolean) => void;
  setAvailableTenants:(tenants: { id: string; name: string; logo?: string }[]) => void;
  switchTenant:       (tenantId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session:          null,
  profile:          null,
  mobileRole:       "patient",
  isLoading:        true,
  availableTenants: [],
  activeTenantId:   null,

  setSession:   (session)  => set({ session }),

  setProfile:   (profile)  => set({
    profile,
    mobileRole:     toMobileRole(profile.role),
    activeTenantId: profile.tenant_id,
  }),

  clearAuth: () => set({
    session: null, profile: null,
    mobileRole: "patient",
    activeTenantId: null,
    availableTenants: [],
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setAvailableTenants: (tenants) => set({ availableTenants: tenants }),

  switchTenant: (tenantId) => {
    const tenants = get().availableTenants;
    const found = tenants.find((t) => t.id === tenantId);
    if (!found) return;
    set({ activeTenantId: tenantId });
    // Profile tenant_name updates for TopBar
    const profile = get().profile;
    if (profile) {
      set({ profile: { ...profile, tenant_id: tenantId, tenant_name: found.name } });
    }
  },
}));
