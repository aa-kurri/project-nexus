import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import {
  type CrawlArtifact,
  PrdSchema,
  SYSTEM_ARCHITECT,
  PRD_USER_TEMPLATE,
} from "@nexus/shared-logic";

export async function generatePrd(artifact: CrawlArtifact) {
  const { object } = await generateObject({
    model: anthropic("claude-opus-4-6", {
      cacheControl: true,
    }),
    schema: PrdSchema,
    system: SYSTEM_ARCHITECT,
    prompt: PRD_USER_TEMPLATE(JSON.stringify(artifact, null, 2)),
    temperature: 0.3,
  });
  return object;
}
