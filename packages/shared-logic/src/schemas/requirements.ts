import { z } from "zod";

export const GherkinScenarioSchema = z.object({
  name: z.string(),
  given: z.array(z.string()).min(1),
  when: z.array(z.string()).min(1),
  then: z.array(z.string()).min(1),
});
export type GherkinScenario = z.infer<typeof GherkinScenarioSchema>;

export const FeatureSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.enum(["auth", "commerce", "content", "search", "social", "analytics", "admin", "other"]),
  summary: z.string(),
});

export const EpicSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  features: z.array(z.string()),
});

export const UserStorySchema = z.object({
  slug: z.string(),
  epicSlug: z.string(),
  asA: z.string(),
  iWant: z.string(),
  soThat: z.string(),
  scenarios: z.array(GherkinScenarioSchema),
  priority: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
});
export type UserStory = z.infer<typeof UserStorySchema>;

export const PrdSchema = z.object({
  title: z.string(),
  vision: z.string(),
  personas: z.array(z.object({ name: z.string(), role: z.string(), goals: z.array(z.string()) })),
  successMetrics: z.array(z.string()),
  epics: z.array(EpicSchema),
  nonFunctional: z.array(z.string()),
});
export type Prd = z.infer<typeof PrdSchema>;
