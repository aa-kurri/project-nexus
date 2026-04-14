import { chromium, type Browser } from "playwright";
import type { CrawlArtifact } from "@nexus/shared-logic";
import { CrawlArtifactSchema } from "@nexus/shared-logic";
import { extractDom } from "./extractors/dom";
import { extractTokens } from "./extractors/tokens";
import { extractSeo } from "./extractors/seo";
import { extractForms } from "./extractors/forms";
import { firecrawlFallback } from "./extractors/firecrawl";

export interface CrawlOptions {
  url: string;
  timeoutMs?: number;
  useFirecrawlFallback?: boolean;
}

export async function ghostCrawl(opts: CrawlOptions): Promise<CrawlArtifact> {
  const { url, timeoutMs = 30_000, useFirecrawlFallback = true } = opts;
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ userAgent: "NexusGhost/1.0 (+https://nexus.local)" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });

    const [domTree, designTokens, seo, forms] = await Promise.all([
      extractDom(page),
      extractTokens(page),
      extractSeo(page),
      extractForms(page),
    ]);

    const artifact: CrawlArtifact = {
      url,
      fetchedAt: new Date().toISOString(),
      domTree,
      designTokens,
      seo,
      forms,
    };
    return CrawlArtifactSchema.parse(artifact);
  } catch (err) {
    if (!useFirecrawlFallback) throw err;
    return firecrawlFallback(url);
  } finally {
    await browser?.close();
  }
}
