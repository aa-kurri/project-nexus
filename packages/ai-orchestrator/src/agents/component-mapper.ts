import { openai } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import { z } from "zod";

const Mapping = z.object({
  registry: z.enum(["shadcn","aceternity","magic_ui","tremor","custom"]),
  componentName: z.string(),
  installCmd: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  codeSnippet: z.string().optional(),
  matchScore: z.number().min(0).max(1),
});
export type ComponentMapping = z.infer<typeof Mapping>;

/**
 * Given a functional spec (natural language), retrieve top candidate components
 * from a pre-built RAG index (registries: shadcn, aceternity, magic-ui, tremor).
 * This stub returns the LLM's structured pick; swap the `retrieve` call for
 * a real Pinecone/pgvector query in production.
 */
export async function mapComponents(spec: string): Promise<ComponentMapping[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: spec,
  });

  const candidates = await retrieve(embedding);

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({ picks: z.array(Mapping).max(3) }),
    prompt: `Spec: ${spec}\nCandidates (JSON):\n${JSON.stringify(candidates)}\nPick up to 3 best components.`,
    temperature: 0.2,
  });
  return object.picks;
}

async function retrieve(_embedding: number[]): Promise<unknown[]> {
  // TODO: replace with pgvector / Pinecone query.
  return [];
}
