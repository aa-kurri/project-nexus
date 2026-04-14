import type { Page } from "playwright";
import type { z } from "zod";
import { SeoSchema } from "@nexus/shared-logic";

export async function extractSeo(page: Page): Promise<z.infer<typeof SeoSchema>> {
  return page.evaluate(() => {
    const meta = (name: string) =>
      document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ||
      document.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ||
      null;

    const og: Record<string, string> = {};
    for (const m of Array.from(document.querySelectorAll('meta[property^="og:"]'))) {
      const key = m.getAttribute("property")!;
      const val = m.getAttribute("content") || "";
      og[key] = val;
    }

    const jsonLd: unknown[] = [];
    for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try { jsonLd.push(JSON.parse(s.textContent || "null")); } catch {}
    }

    return {
      title: document.title || null,
      description: meta("description"),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || null,
      og,
      jsonLd,
    };
  });
}
