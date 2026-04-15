'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface TenantBranding {
  tenant_id: string | null;
  tenant_name: string;
  logo_url: string;
  primary_color: string;
}

const TenantBrandContext = createContext<TenantBranding | null>(null);

export function useTenantBrand() {
  const context = useContext(TenantBrandContext);
  if (!context) {
    throw new Error('useTenantBrand must be used within TenantBrandProvider');
  }
  return context;
}

interface TenantBrandProviderProps {
  children: React.ReactNode;
}

/**
 * TenantBrandProvider — Reads tenant branding from middleware-injected cookie
 * and applies CSS variable overrides for colors and logo.
 *
 * TODO: Support runtime brand updates via mutation
 * TODO: Add fallback for cookie-less environments (SSR edge cases)
 * TODO: Cache branding in localStorage to reduce re-renders
 */
export function TenantBrandProvider({ children }: TenantBrandProviderProps) {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Parse tenant-branding cookie set by middleware
    const cookieString = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant-branding='))
      ?.split('=')[1];

    let parsedBranding: TenantBranding;

    if (cookieString) {
      try {
        parsedBranding = JSON.parse(decodeURIComponent(cookieString));
      } catch (err) {
        console.error('[TenantBrandProvider] Failed to parse branding cookie:', err);
        parsedBranding = {
          tenant_id: null,
          tenant_name: 'Ayura OS',
          logo_url: '',
          primary_color: '#0F766E',
        };
      }
    } else {
      parsedBranding = {
        tenant_id: null,
        tenant_name: 'Ayura OS',
        logo_url: '',
        primary_color: '#0F766E',
      };
    }

    setBranding(parsedBranding);

    // TODO: Apply CSS variable overrides to document root
    //       This allows Tailwind classes and custom CSS to reference --primary-color
    const root = document.documentElement;
    const primaryColor = parsedBranding.primary_color || '#0F766E';

    // Convert hex to HSL for CSS variable usage
    // For now, set raw hex value — components can use via var(--primary-color)
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--primary-color-rgb', hexToRgb(primaryColor));

    // TODO: If logo_url provided, preload and cache in context for TopBar/Header
    if (parsedBranding.logo_url) {
      const img = new Image();
      img.src = parsedBranding.logo_url;
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    // TODO: Add loading skeleton or suspense boundary
    return <>{children}</>;
  }

  return (
    <TenantBrandContext.Provider value={branding || {
      tenant_id: null,
      tenant_name: 'Ayura OS',
      logo_url: '',
      primary_color: '#0F766E',
    }}>
      {children}
    </TenantBrandContext.Provider>
  );
}

/**
 * Convert hex color to RGB string for CSS var() usage in rgb()
 * e.g. "#0F766E" → "15, 118, 110"
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '15, 118, 110'; // fallback to primary color RGB
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
}
