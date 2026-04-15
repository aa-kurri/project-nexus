import type { Metadata } from "next";
import "./globals.css";
import { TenantBrandProvider } from "@/components/saas/TenantBrandProvider";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Project Nexus",
  description: "URL → PRD → Sprint backlog → Production code. One pipeline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <TenantBrandProvider>
          {children}
        </TenantBrandProvider>
      </body>
    </html>
  );
}
