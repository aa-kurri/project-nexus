import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Route groups that require an authenticated Supabase session
// ---------------------------------------------------------------------------
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/opd',
  '/ipd',
  '/emr',
  '/lims',
  '/pharmacy',
  '/billing',
  '/analytics',
  '/clinical',
  '/settings',
  '/ai',
  '/account',
  '/lock',
];

const PUBLIC_PREFIXES = ['/auth', '/onboard', '/_next', '/favicon.ico'];

function isProtected(pathname: string): boolean {
  if (pathname === '/') return false;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  // ------------------------------------------------------------------
  // 1. Auth guard — validate JWT session with SSR Supabase client
  //    getUser() calls the Supabase Auth server to verify the JWT.
  // ------------------------------------------------------------------
  let response = NextResponse.next({ request: { headers: req.headers } });

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();

  // Unauthenticated access to a protected route → redirect to login
  if (isProtected(pathname) && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting login/register → bounce to dashboard
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    dashUrl.searchParams.delete('next');
    return NextResponse.redirect(dashUrl);
  }

  // ------------------------------------------------------------------
  // 2. Tenant branding cookie (preserved from original implementation)
  // ------------------------------------------------------------------
  let tenantDomain = host.split(':')[0];
  if (tenantDomain === 'localhost') {
    tenantDomain = new URL(req.url).searchParams.get('tenant') || 'default';
  }

  const adminClient = getAdminClient();

  if (!adminClient) {
    response.cookies.set('tenant-branding', JSON.stringify({
      tenant_id: null,
      tenant_name: 'Ayura OS',
      logo_url: '',
      primary_color: '#0F766E',
    }), { httpOnly: false, maxAge: 86400, path: '/' });
    return response;
  }

  try {
    const { data: tenant, error } = await adminClient
      .from('tenants')
      .select('id, name, logo_url, primary_color, display_name, custom_domain, subdomain')
      .or(`custom_domain.eq.${tenantDomain},subdomain.eq.${tenantDomain.split('.')[0]}`)
      .single();

    if (!error && tenant) {
      response.cookies.set('tenant-branding', JSON.stringify({
        tenant_id: tenant.id,
        tenant_name: tenant.display_name || tenant.name,
        logo_url: tenant.logo_url || '',
        primary_color: tenant.primary_color || '#0F766E',
      }), { httpOnly: false, maxAge: 86400, path: '/' });

      response.headers.set('X-Tenant-ID', tenant.id);
    } else {
      response.cookies.set('tenant-branding', JSON.stringify({
        tenant_id: null,
        tenant_name: 'Ayura OS',
        logo_url: '',
        primary_color: '#0F766E',
      }), { httpOnly: false, maxAge: 86400, path: '/' });
    }
  } catch (err) {
    console.error('[middleware] tenant lookup failed:', err);
    response.cookies.set('tenant-branding', JSON.stringify({
      tenant_id: null,
      tenant_name: 'Ayura OS',
      logo_url: '',
      primary_color: '#0F766E',
    }), { httpOnly: false, maxAge: 86400, path: '/' });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/internal).*)',
  ],
};
