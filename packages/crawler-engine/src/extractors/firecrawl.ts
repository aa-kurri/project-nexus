import FirecrawlApp from "@mendable/firecrawl-js";
import type { CrawlArtifact } from "@nexus/shared-logic";
import { CrawlArtifactSchema } from "@nexus/shared-logic";

export async function firecrawlFallback(url: string): Promise<CrawlArtifact> {
  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const res = await app.scrapeUrl(url, { formats: ["markdown", "html"] });
  if (!res.success) throw new Error(`Firecrawl failed: ${res.error}`);

  const artifact: CrawlArtifact = {
    url,
    fetchedAt: new Date().toISOString(),
    domTree: { kind: "unknown", children: [] },
    designTokens: {
      colors: { primary: [], neutral: [], semantic: {} },
      typography: { families: [], scale: [] },
      spacing: [],
      radii: [],
    },
    seo: {
      title: res.metadata?.title ?? null,
      description: res.metadata?.description ?? null,
      canonical: null,
      og: {},
      jsonLd: [],
    },
    forms: [],
    rawMarkdown: res.markdown,
  };
  return CrawlArtifactSchema.parse(artifact);
}
