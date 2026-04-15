'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';

export interface UpdateBrandingPayload {
  tenant_id: string;
  logo_url?: string;
  primary_color?: string;
  display_name?: string;
  custom_domain?: string;
}

export interface BrandingResult {
  ok: boolean;
  error?: string;
  data?: {
    logo_url: string | null;
    primary_color: string;
    display_name: string | null;
    custom_domain: string | null;
  };
}

/**
 * updateTenantBranding — Update hospital logo, primary color, and custom domain.
 *
 * TODO: Validate user is tenant admin via RLS check in profiles table.
 * TODO: Validate logo_url is reachable and image type (jpg/png/svg).
 * TODO: Validate custom_domain is not already claimed by another tenant.
 * TODO: Validate custom_domain DNS CNAME record points to app (production).
 * TODO: Validate primary_color is valid hex format (#RRGGBB).
 * TODO: Trigger middleware cache invalidation (e.g., via Redis pub/sub or webhook).
 * TODO: Audit log entry for branding change via audit_log table.
 * TODO: Send notification email to tenant admin with updated branding.
 */
export async function updateTenantBranding(
  payload: UpdateBrandingPayload
): Promise<BrandingResult> {
  const supabase = supabaseServer();
  const admin = supabaseAdmin();

  // TODO: Get current user tenant_id from auth context
  //       Verify user.tenant_id === payload.tenant_id (authorization)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Unauthorized: user not authenticated' };
  }

  // TODO: Validate payload fields
  if (payload.primary_color && !/^#[0-9A-F]{6}$/i.test(payload.primary_color)) {
    return { ok: false, error: 'Invalid primary_color format. Expected hex: #RRGGBB' };
  }

  try {
    // TODO: Use service role client (admin) to bypass RLS for tenant lookup
    //       In production, enforce tenant ownership check via custom claim or stored procedure
    const { data: tenant, error: lookupError } = await admin
      .from('tenants')
      .select('id, custom_domain')
      .eq('id', payload.tenant_id)
      .single();

    if (lookupError || !tenant) {
      return { ok: false, error: 'Tenant not found' };
    }

    // TODO: If custom_domain provided, check it's not already taken
    if (payload.custom_domain && payload.custom_domain !== tenant.custom_domain) {
      const { data: existingDomain } = await admin
        .from('tenants')
        .select('id')
        .eq('custom_domain', payload.custom_domain)
        .single();

      if (existingDomain) {
        return { ok: false, error: 'Custom domain is already claimed' };
      }
    }

    // TODO: Update tenants table with new branding
    const updatePayload: Record<string, unknown> = {};
    if (payload.logo_url !== undefined) updatePayload.logo_url = payload.logo_url;
    if (payload.primary_color !== undefined) updatePayload.primary_color = payload.primary_color;
    if (payload.display_name !== undefined) updatePayload.display_name = payload.display_name;
    if (payload.custom_domain !== undefined) updatePayload.custom_domain = payload.custom_domain;

    const { data: updated, error: updateError } = await admin
      .from('tenants')
      .update(updatePayload)
      .eq('id', payload.tenant_id)
      .select('logo_url, primary_color, display_name, custom_domain')
      .single();

    if (updateError) {
      console.error('[updateTenantBranding] update failed:', updateError);
      return { ok: false, error: `Database error: ${updateError.message}` };
    }

    // TODO: Invalidate middleware cache for this domain
    //       Could queue a job to purge Vercel Edge Config or notify Redis
    console.log('[updateTenantBranding] branding updated:', { tenant_id: payload.tenant_id, updated });

    return {
      ok: true,
      data: {
        logo_url: updated?.logo_url || null,
        primary_color: updated?.primary_color || '#0F766E',
        display_name: updated?.display_name || null,
        custom_domain: updated?.custom_domain || null,
      },
    };
  } catch (err) {
    console.error('[updateTenantBranding] unexpected error:', err);
    return { ok: false, error: 'Internal server error' };
  }
}

/**
 * validateCustomDomain — Check if a custom domain is available and valid.
 *
 * TODO: Validate domain format (alphanumeric, hyphen, dot).
 * TODO: Check domain is not reserved (ayura.hospital, localhost, etc).
 * TODO: Verify CNAME DNS record exists pointing to app (optional, for UX feedback).
 * TODO: Rate limit this endpoint to prevent abuse.
 */
export async function validateCustomDomain(
  domain: string
): Promise<BrandingResult> {
  if (!domain || domain.length < 3 || domain.length > 63) {
    return { ok: false, error: 'Domain must be 3-63 characters' };
  }

  // TODO: Regex validate domain format
  if (!/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/i.test(domain)) {
    return { ok: false, error: 'Invalid domain format. Use only alphanumeric and hyphens.' };
  }

  const reserved = ['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'ayura'];
  if (reserved.includes(domain.toLowerCase())) {
    return { ok: false, error: `"${domain}" is reserved` };
  }

  try {
    const admin = supabaseAdmin();

    // TODO: Check if domain is already taken
    const { data: existing } = await admin
      .from('tenants')
      .select('id')
      .eq('custom_domain', domain)
      .single();

    if (existing) {
      return { ok: false, error: 'This domain is already claimed' };
    }

    // TODO: (Optional) DNS verification via DNS lookup
    //       const hasValidCName = await resolveCName(domain);

    return { ok: true };
  } catch (err) {
    console.error('[validateCustomDomain] error:', err);
    return { ok: false, error: 'Validation failed' };
  }
}
