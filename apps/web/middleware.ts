import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const response = NextResponse.next();

  // TODO: Extract tenant identifier from custom_domain or subdomain
  //       Patterns: custom-domain.com | hospital-name.localhost:3000 | subdomain.ayura.hospital.com
  let tenantDomain = host.split(':')[0]; // Remove port
  if (tenantDomain === 'localhost') {
    // Extract subdomain from query param for localhost dev
    tenantDomain = new URL(req.url).searchParams.get('tenant') || 'default';
  }

  try {
    // TODO: Query tenants table by custom_domain OR subdomain
    //       Use service role to bypass RLS for middleware lookup
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, logo_url, primary_color, display_name, custom_domain, subdomain')
      .or(`custom_domain.eq.${tenantDomain},subdomain.eq.${tenantDomain.split('.')[0]}`)
      .single();

    if (!error && tenant) {
      // TODO: Validate custom_domain CNAME DNS record exists (optional, for production)

      // Set branding cookie with tenant metadata
      const branding = {
        tenant_id: tenant.id,
        tenant_name: tenant.display_name || tenant.name,
        logo_url: tenant.logo_url || '',
        primary_color: tenant.primary_color || '#0F766E',
      };

      response.cookies.set('tenant-branding', JSON.stringify(branding), {
        httpOnly: false, // Client needs to read this
        maxAge: 86400, // 24 hours
        path: '/',
      });

      // TODO: Set X-Tenant-ID header for downstream APIs
      response.headers.set('X-Tenant-ID', tenant.id);
    } else {
      // Default branding for unknown tenant
      response.cookies.set('tenant-branding', JSON.stringify({
        tenant_id: null,
        tenant_name: 'Ayura OS',
        logo_url: '',
        primary_color: '#0F766E',
      }), {
        httpOnly: false,
        maxAge: 86400,
        path: '/',
      });
    }
  } catch (err) {
    console.error('[middleware] tenant lookup failed:', err);
    // Continue with default branding on error
    response.cookies.set('tenant-branding', JSON.stringify({
      tenant_id: null,
      tenant_name: 'Ayura OS',
      logo_url: '',
      primary_color: '#0F766E',
    }), {
      httpOnly: false,
      maxAge: 86400,
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and api internal routes
    '/((?!_next/static|_next/image|favicon.ico|api/internal).*)',
  ],
};
