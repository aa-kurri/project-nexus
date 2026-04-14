import { z } from "zod";

export const DesignTokensSchema = z.object({
  colors: z.object({
    primary: z.array(z.string()),
    neutral: z.array(z.string()),
    semantic: z.record(z.string()).optional(),
  }),
  typography: z.object({
    families: z.array(z.string()),
    scale: z.array(z.object({ name: z.string(), size: z.string(), lineHeight: z.string() })),
  }),
  spacing: z.array(z.number()),
  radii: z.array(z.number()),
});

export const FormPatternSchema = z.object({
  purpose: z.enum(["auth_login", "auth_signup", "checkout", "contact", "search", "newsletter", "other"]),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    validation: z.string().optional(),
  })),
  action: z.string().nullable(),
});

export const SeoSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  canonical: z.string().nullable(),
  og: z.record(z.string()).default({}),
  jsonLd: z.array(z.any()).default([]),
});

export const DomNodeSchema: z.ZodType<DomNode> = z.lazy(() =>
  z.object({
    kind: z.enum(["nav", "hero", "feature", "cta", "footer", "form", "card", "list", "unknown"]),
    text: z.string().optional(),
    href: z.string().optional(),
    children: z.array(DomNodeSchema).default([]),
  })
);
export type DomNode = {
  kind: "nav" | "hero" | "feature" | "cta" | "footer" | "form" | "card" | "list" | "unknown";
  text?: string;
  href?: string;
  children: DomNode[];
};

export const CrawlArtifactSchema = z.object({
  url: z.string().url(),
  fetchedAt: z.string().datetime(),
  domTree: DomNodeSchema,
  designTokens: DesignTokensSchema,
  seo: SeoSchema,
  forms: z.array(FormPatternSchema),
  rawMarkdown: z.string().optional(),
});
export type CrawlArtifact = z.infer<typeof CrawlArtifactSchema>;
