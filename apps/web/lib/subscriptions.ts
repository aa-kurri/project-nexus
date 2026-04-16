import { createClient } from "@/utils/supabase/server";

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export async function getTenantTier(tenantId: string): Promise<SubscriptionTier> {
  const supabase = createClient();
  const { data } = await supabase
    .from("tenant_subscriptions")
    .select("tier")
    .eq("tenant_id", tenantId)
    .single();

  return (data?.tier as SubscriptionTier) || 'free';
}

export const FEATURES_BY_TIER: Record<SubscriptionTier, string[]> = {
  free: ['emr.basic', 'billing.basic'],
  basic: ['emr.basic', 'billing.basic', 'lims.basic', 'pharmacy.basic'],
  pro: ['emr.full', 'billing.full', 'lims.full', 'pharmacy.full', 'ai.scribe', 'whatsapp.concierge'],
  enterprise: ['emr.full', 'billing.full', 'lims.full', 'pharmacy.full', 'ai.scribe', 'whatsapp.concierge', 'abdm.linked'],
};

export async function hasFeature(tenantId: string, feature: string): Promise<boolean> {
  const tier = await getTenantTier(tenantId);
  const allowed = FEATURES_BY_TIER[tier];
  
  // Basic substring matching for feature flags
  return allowed.some(f => feature.startsWith(f.split('.')[0]));
}
